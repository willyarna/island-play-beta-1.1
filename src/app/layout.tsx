import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Island Play — Control rentable para tu negocio streaming",
  description: "Gestiona cuentas, clientes, proveedores, vencimientos y rentabilidad de tu negocio de streaming desde un solo lugar.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/assets/island-play-icon-clean.png", type: "image/png", sizes: "1024x1024" }
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
