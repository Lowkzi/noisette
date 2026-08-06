"use client";

import { deleteCategory } from "@/app/actions/categories";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  return (
    <form
      action={async () => {
        await deleteCategory(categoryId);
      }}
    >
      <button type="submit" className="text-slate-500 hover:text-red-400 transition" aria-label="Supprimer">
        ✕
      </button>
    </form>
  );
}
