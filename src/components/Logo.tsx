export function Logo() {
  return (
    <div className="brand-lockup flex items-center gap-3.5" aria-label="Island Play">
      <div className="brand-logo-orb">
        <img src="/assets/island-play-mark-clean.png" alt="" />
      </div>
      <div className="brand-copy">
        <img className="brand-wordmark-image" src="/assets/island-play-wordmark-header.png" alt="Island Play" />
        <span className="brand-subtitle">Control total para revendedores streaming</span>
      </div>
    </div>
  );
}
