"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { CategoryFormSchema, CategoryFormState } from "@/lib/definitions";

export async function createCategory(state: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const validatedFields = CategoryFormSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, kind, color } = validatedFields.data;

  await prisma.category.create({
    data: { householdId, name, kind, color: color ?? null },
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/budget");
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.category.deleteMany({ where: { id: categoryId, householdId } });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/budget");
}
