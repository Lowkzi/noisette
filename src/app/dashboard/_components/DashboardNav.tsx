"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/actions/auth";

// Liens du quotidien, affichés directement dans la barre.
const PRIMARY_LINKS = [
  { href: "/dashboard/transactions", label: "Dépenses & revenus" },
  { href: "/dashboard/comptes", label: "Comptes" },
  { href: "/dashboard/budget", label: "Budget" },
];

// Liens moins fréquents, regroupés sous "Plus" pour alléger la barre principale.
const MORE_LINKS = [
  { href: "/dashboard/epargne", label: "Épargne" },
  { href: "/dashboard/factures", label: "Factures récurrentes" },
  { href: "/dashboard/achats", label: "Achats ponctuels" },
  { href: "/dashboard/categories", label: "Catégories" },
  { href: "/dashboard/rapports", label: "Rapports" },
  { href: "/dashboard/foyer", label: "Foyer" },
];

type NavUser = {
  name: string | null;
  email: string;
  role: string;
};

export function DashboardNav({ user }: { user: NavUser | null }) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open && !moreOpen) return;
    function onOutsideClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open, moreOpen]);

  return (
    <nav
      ref={navRef}
      className="border-b border-slate-800 sticky top-0 z-40 bg-slate-900/95 backdrop-blur"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-6 text-sm">
        <Link href="/dashboard" className="font-semibold text-white flex items-center gap-2 shrink-0">
          <Image src="/squirrel-logo.png" alt="" width={24} height={24} className="shrink-0" />
          Noisette
        </Link>

        <div className="hidden lg:flex items-center gap-5">
          {PRIMARY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-400 hover:text-white transition">
              {link.label}
            </Link>
          ))}
          <div className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition"
              aria-expanded={moreOpen}
            >
              Plus
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {moreOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1">
                {MORE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {user && (
            <span className="hidden sm:inline text-slate-400 text-sm">{user.name ?? user.email}</span>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="text-slate-400 hover:text-white text-sm border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition"
            >
              Déconnexion
            </button>
          </form>
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition shrink-0"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-800 px-4 py-3 space-y-1">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-800">
            {MORE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
