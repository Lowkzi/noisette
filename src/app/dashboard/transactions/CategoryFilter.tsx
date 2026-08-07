"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Category = { id: string; name: string };

export function CategoryFilter({ categories, categoryId }: { categories: Category[]; categoryId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("categoryId", value);
    else params.delete("categoryId");
    router.push(`/dashboard/transactions?${params.toString()}`);
  }

  return (
    <select
      value={categoryId ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm"
    >
      <option value="">Toutes les catégories</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
