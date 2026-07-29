#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-island-play-beta-1.1}"
OWNER="${GITHUB_OWNER:-willyarna}"
BRANCH="${GITHUB_BRANCH:-main}"
VERSION_TAG="${VERSION_TAG:-v1.1.0-beta}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$(mktemp -d /tmp/island-play-new-version-XXXXXX)"
ASKPASS_SCRIPT="$WORK_DIR/git-askpass.sh"
REPO_URL="https://github.com/${OWNER}/${REPO_NAME}.git"
API_REPO_URL="https://api.github.com/repos/${OWNER}/${REPO_NAME}"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "ERROR: Falta GITHUB_TOKEN en esta terminal."
  echo "En fish usa:"
  echo "  set -gx GITHUB_TOKEN 'TU_TOKEN_DE_GITHUB'"
  echo "En bash usa:"
  echo "  export GITHUB_TOKEN='TU_TOKEN_DE_GITHUB'"
  exit 2
fi

cat > "$ASKPASS_SCRIPT" <<'EOF'
#!/usr/bin/env bash
case "$1" in
  *Username*) echo "x-access-token" ;;
  *Password*) echo "$GITHUB_TOKEN" ;;
  *) echo "" ;;
esac
EOF
chmod 700 "$ASKPASS_SCRIPT"
export GIT_ASKPASS="$ASKPASS_SCRIPT"
export GIT_TERMINAL_PROMPT=0

echo "Preparando subida de Island Play a ${REPO_URL}"

repo_http_status="$(
  curl -sS -o "$WORK_DIR/repo-check.json" -w "%{http_code}" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "$API_REPO_URL"
)"

if [[ "$repo_http_status" == "404" ]]; then
  echo "El repositorio no existe. Intentando crearlo como privado..."
  create_status="$(
    curl -sS -o "$WORK_DIR/repo-create.json" -w "%{http_code}" \
      -X POST \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      https://api.github.com/user/repos \
      -d "{\"name\":\"${REPO_NAME}\",\"private\":true,\"description\":\"Island Play beta development snapshot\"}"
  )"

  if [[ "$create_status" != "201" ]]; then
    echo "ERROR: GitHub no permitió crear el repositorio automáticamente."
    echo "Crea manualmente un repositorio privado llamado '${REPO_NAME}' y vuelve a ejecutar este script."
    echo "Respuesta de GitHub:"
    sed -n '1,160p' "$WORK_DIR/repo-create.json"
    exit 4
  fi
elif [[ "$repo_http_status" != "200" ]]; then
  echo "ERROR: No pude verificar el repositorio en GitHub. HTTP ${repo_http_status}"
  sed -n '1,160p' "$WORK_DIR/repo-check.json"
  exit 5
fi

echo "Clonando repositorio en temporal..."
git clone "$REPO_URL" "$WORK_DIR/repo"

echo "Copiando proyecto sin secretos, builds locales ni carpetas pesadas..."
rsync -a --delete \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='.vercel' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.log' \
  --exclude='tsconfig.tsbuildinfo' \
  --exclude='larsa-play-v1.0.0-beta.bundle' \
  --exclude='.agents' \
  --exclude='.codex' \
  --exclude='skills-lock.json' \
  --exclude='docs/research/NETFLY_ACCESS.md' \
  --exclude='docs/research/NETFLY_GAP_ANALYSIS.md' \
  --exclude='docs/research/netfly' \
  --exclude='docs/design-references/netfly' \
  --exclude='scripts/netfly-*.mjs' \
  "$PROJECT_ROOT/" "$WORK_DIR/repo/"

cd "$WORK_DIR/repo"

git config user.name "${GIT_COMMITTER_NAME:-Island Play Backup Bot}"
git config user.email "${GIT_COMMITTER_EMAIL:-willyarna@gmail.com}"

echo "Validando que no se vayan secretos o carpetas no deseadas..."
FORBIDDEN_STATUS_REGEX='(^.. \.env($|[./])|/\.env($|[./])|node_modules($|/)|\.next($|/)|(^.. |/)\.vercel($|/))'
if git status --short | grep -E "$FORBIDDEN_STATUS_REGEX" >/dev/null; then
  echo "ERROR: Se detectó un archivo sensible o carpeta no permitida en el commit."
  git status --short | grep -E "$FORBIDDEN_STATUS_REGEX" || true
  exit 6
fi

git diff --check
git add -A

if git diff --cached --quiet; then
  echo "No hay cambios nuevos para subir."
else
  git commit -m "chore: snapshot Island Play beta 1.1"
fi

git branch -M "$BRANCH"
git push -u origin "$BRANCH"

if git ls-remote --exit-code --tags origin "refs/tags/${VERSION_TAG}" >/dev/null 2>&1; then
  VERSION_TAG="${VERSION_TAG}-$(date +%Y%m%d%H%M%S)"
fi

git tag -a "$VERSION_TAG" -m "Island Play beta snapshot ${VERSION_TAG}"
git push origin "$VERSION_TAG"

echo "Listo."
echo "Repositorio: https://github.com/${OWNER}/${REPO_NAME}"
echo "Rama: ${BRANCH}"
echo "Tag: ${VERSION_TAG}"
