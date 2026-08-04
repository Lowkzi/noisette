import type { NextConfig } from "next";

// Toutes les dates (transactions, budgets, factures) sont interprétées en heure de Paris.
// Fixé sans condition : un conteneur qui exporterait TZ=UTC ne doit pas pouvoir
// décaler silencieusement les dates stockées pour cette appli mono-région.
process.env.TZ = "Europe/Paris";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
