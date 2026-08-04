"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser, getHouseholdId } from "@/lib/dal";
import { InviteMemberFormSchema, InviteMemberFormState } from "@/lib/definitions";

export async function inviteMember(
  state: InviteMemberFormState,
  formData: FormData
): Promise<InviteMemberFormState> {
  const householdId = await getHouseholdId();
  const user = await getUser();
  if (!householdId || !user) return { message: "Foyer introuvable." };

  const validatedFields = InviteMemberFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { message: "Un compte existe déjà avec cet email." };
  }

  const invite = await prisma.householdInvite.create({
    data: { householdId, email, invitedById: user.id },
  });

  revalidatePath("/dashboard/foyer");
  return { inviteUrl: `/signup/invite/${invite.id}` };
}

export async function removeMember(memberId: string) {
  const householdId = await getHouseholdId();
  const user = await getUser();
  if (!householdId || !user || user.role !== "OWNER" || memberId === user.id) return;

  await prisma.user.updateMany({
    where: { id: memberId, householdId },
    data: { householdId: null },
  });

  revalidatePath("/dashboard/foyer");
}
