import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noisette — Finances du foyer",
  description: "Gérez les comptes, dépenses, budgets et objectifs d'épargne de votre foyer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
