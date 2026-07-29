#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/willyarna/larsa-play-beta-1.0.git"
BRANCH="main"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$(mktemp -d /tmp/island-play-sync-XXXXXX)"
ASKPASS_SCRIPT="$WORK_DIR/git-askpass.sh"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "ERROR: Falta GITHUB_TOKEN en esta terminal."
  echo "En fish usa: set -gx GITHUB_TOKEN 'TU_TOKEN'"
  echo "En bash usa: export GITHUB_TOKEN='TU_TOKEN'"
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

echo "Clonando repositorio privado en un directorio temporal..."
git clone "$REPO_URL" "$WORK_DIR/repo"

echo "Copiando proyecto sin archivos sensibles ni carpetas pesadas..."
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

echo "Validando que no se vayan secretos o carpetas no deseadas..."
if git status --short | grep -E '(^.. \.env|/\.env|\.env$|node_modules|\.next|\.vercel)' >/dev/null; then
  echo "ERROR: Se detectó un archivo sensible o carpeta no permitida en el commit."
  git status --short | grep -E '(^.. \.env|/\.env|\.env$|node_modules|\.next|\.vercel)' || true
  exit 3
fi

git diff --check
git add -A

if git diff --cached --quiet; then
  echo "No hay cambios nuevos para subir."
else
  git commit -m "feat: actualiza Island Play beta"
  git push origin "$BRANCH"
fi

echo "Listo. Commit actual:"
git rev-parse --short HEAD
