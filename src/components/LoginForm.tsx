"use client";

import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  BriefcaseBusiness,
  Database,
  Eye,
  EyeOff,
  LockKeyhole,
  PackagePlus,
  Play,
  Send,
  ShieldCheck,
  UsersRound,
  WalletCards
} from "lucide-react";

const features = [
  { icon: UsersRound, title: "Gestión de cuentas y perfiles", copy: "Inventario completo de accesos, perfiles y clientes." },
  { icon: Database, title: "Base de datos de clientes", copy: "Historial detallado de cada cliente y servicio." },
  { icon: Bell, title: "Alertas de vencimiento", copy: "Notificaciones automáticas para evitar cortes de servicio." },
  { icon: Send, title: "Notificaciones automáticas", copy: "Envía información de cuenta y recordatorios de pago." },
  { icon: WalletCards, title: "Gestión de proveedores", copy: "Controla costos, pagos y contactos de tus mayoristas." },
  { icon: PackagePlus, title: "Catálogo de combos", copy: "Crea paquetes atractivos con margen de ganancia calculado." },
  { icon: BarChart3, title: "Panel de rentabilidad", copy: "Visualiza inversión y ganancias netas en tiempo real." },
  { icon: BriefcaseBusiness, title: "Reportes centralizados", copy: "Adiós al caos de las hojas de cálculo." },
  { icon: ShieldCheck, title: "Acceso seguro", copy: "Tu negocio protegido con sesiones y control privado." }
];

const countries = ["🇺🇸", "🇪🇸", "🇲🇽", "🇨🇴", "🇦🇷", "🇨🇱", "🇵🇪", "🇪🇨", "🇩🇴", "🇵🇷", "🇨🇷", "🇵🇦"];

const testimonials = [
  {
    name: "Miguel Torres",
    role: "Revendedor Premium",
    avatar: "M",
    copy: "Desde que uso Island Play, he reducido a la mitad el tiempo que paso organizando las cuentas. Mis clientes están más contentos porque nunca se quedan sin servicio y los cortes son cosa del pasado."
  },
  {
    name: "Carolina Méndez",
    role: "Agencia de Streaming",
    avatar: "C",
    copy: "La gestión de proveedores y el panel de rentabilidad son un cambio de juego total. Ahora sé exactamente cuánto gano cada mes sin romperme la cabeza con complejas hojas de cálculo."
  },
  {
    name: "Diego Silva",
    role: "Emprendedor Digital",
    avatar: "D",
    copy: "El sistema de notificaciones automáticas me salvó la vida. Ya no tengo que enviar tediosos mensajes manuales a mis clientes para recordarles los pagos o las renovaciones mensuales."
  }
];

export function LoginForm() {
  const [email, setEmail] = useState("admin@larsaplay.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        setError("El correo o la contraseña no coinciden.");
        return;
      }

      window.location.assign("/");
    } catch {
      setError("No pudimos conectar con el servidor. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ip-landing">
      <nav className="ip-nav" aria-label="Navegación principal">
        <a className="ip-brand" href="#inicio" aria-label="Island Play, inicio">
          <img src="/assets/island-play-icon-clean.png" alt="" />
          <span>Island<br />Play</span>
        </a>
        <div className="ip-nav-links">
          <a className="active" href="#producto">Producto</a>
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#precios">Precios</a>
        </div>
        <div className="ip-nav-actions">
          <a className="ip-login-mini" href="#acceso">Iniciar sesión</a>
          <a className="ip-start-mini" href="#acceso">Empezar ahora</a>
        </div>
      </nav>

      <section className="ip-hero" id="inicio">
        <div className="ip-hero-copy">
          <h1>Toma el control <span>total</span><br />de tu negocio de<br />reventa de streaming</h1>
          <p>Administra cuentas, perfiles, clientes, proveedores y ganancias en un solo lugar. La plataforma definitiva para revendedores de Netflix, Disney+, Max y más.</p>
          <div className="ip-hero-actions">
            <a className="ip-cta" href="#acceso">Empezar ahora <ArrowRight size={18} /></a>
            <a className="ip-ghost" href="#como-funciona"><Play size={15} /> Ver cómo funciona</a>
          </div>

          <form id="acceso" onSubmit={submit} className="ip-access-card">
            <div className="ip-access-title"><LockKeyhole size={15} /> Acceso privado y protegido</div>
            <label>
              <span>Correo electrónico</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                type="email"
                placeholder="Correo electrónico"
                required
              />
            </label>
            <label>
              <span>Contraseña</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Contraseña"
                required
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </label>
            {error ? <p className="ip-login-error" role="alert">{error}</p> : null}
            <button className="ip-login-button" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar a Island Play"}
            </button>
          </form>
        </div>

        <div className="ip-dashboard-showcase" aria-hidden="true">
          <div className="ip-glow-orb one" />
          <div className="ip-glow-orb two" />
          <div className="ip-dashboard-card">
            <div className="ip-dashboard-top">
              <span><Database size={16} /></span>
              <i />
            </div>
            <div className="ip-dashboard-body">
              <aside>
                {["Dashboard", "Clientes", "Cuentas", "Proveedores", "Combos"].map((item, index) => <b key={item} className={index === 0 ? "on" : ""}>{item}</b>)}
              </aside>
              <section>
                <div className="ip-mini-kpis"><span>1,234<small>Cuentas</small></span><span>1,200<small>Clientes</small></span><span>$21.8M<small>Ganancia</small></span><span>43<small>Alertas</small></span></div>
                <div className="ip-chart"><i /><i /><i /><i /><i /></div>
                <div className="ip-table-lines">{Array.from({ length: 5 }).map((_, index) => <span key={index} />)}</div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="ip-stats" aria-label="Métricas de confianza">
        <article><strong>5,000+</strong><span>Cuentas administradas</span></article>
        <article><strong>1,200+</strong><span>Negocios confían</span></article>
        <article><strong>99.9%</strong><span>Uptime garantizado</span></article>
      </section>

      <section className="ip-features" id="funcionalidades">
        <div className="ip-section-title">
          <h2>Todo lo que necesitas, en <span>un solo lugar</span></h2>
          <p>Diseñado específicamente para las necesidades complejas del mercado de reventa de streaming.</p>
        </div>
        <div className="ip-feature-grid">
          {features.map(({ icon: Icon, title, copy }) => (
            <article className="ip-feature-card" key={title}>
              <span><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ip-scale-card" id="precios">
        <h2>¿Listo para escalar tu negocio?</h2>
        <p>Únete a cientos de revendedores que ya automatizaron su gestión y aumentaron sus márgenes de ganancia.</p>
        <a className="ip-cta" href="#acceso">Transforma tu negocio hoy</a>
      </section>

      <section className="ip-global" id="como-funciona">
        <div className="ip-section-title">
          <h2>Presencia a nivel <span>global</span></h2>
          <p>Cobertura total y optimizada para todos los países de habla hispana y Estados Unidos.</p>
        </div>
        <div className="ip-country-row">
          {countries.map((country, index) => <span key={`${country}-${index}`}>{country}</span>)}
        </div>
      </section>

      <section className="ip-testimonials">
        <div className="ip-section-title">
          <h2>La confianza de nuestros <span>usuarios</span></h2>
          <p>Descubre cómo Island Play ha transformado la gestión de cientos de negocios.</p>
        </div>
        <div className="ip-testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="ip-testimonial-card" key={testimonial.name}>
              <div className="ip-stars">★★★★★</div>
              <p>“{testimonial.copy}”</p>
              <div>
                <span>{testimonial.avatar}</span>
                <b>{testimonial.name}<small>{testimonial.role}</small></b>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="ip-footer">
        <div className="ip-footer-brand"><img src="/assets/island-play-icon-clean.png" alt="" /><span>Island Play</span></div>
        <p>© 2026 Island Play. Todos los derechos reservados.</p>
        <nav><a href="#inicio">Privacidad</a><a href="#inicio">Términos</a><a href="#inicio">Soporte</a><a href="#inicio">Contacto</a></nav>
      </footer>
    </main>
  );
}
