import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "NexaDesk", template: "%s · NexaDesk" },
  description: "Uma central de suporte criada para equipes que precisam de contexto e clareza.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning><body>{children}</body></html>;
}
