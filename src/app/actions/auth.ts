"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import {
  LoginFormSchema,
  LoginFormState,
  SignupFormSchema,
  SignupFormState,
} from "@/lib/definitions";

export async function signup(state: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const inviteId = formData.get("inviteId");
  let invite = null;

  if (typeof inviteId === "string" && inviteId) {
    invite = await prisma.householdInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.acceptedAt) {
      return { message: "Ce lien d'invitation n'est plus valide." };
    }
  }

  const validatedFields = SignupFormSchema.safeParse({
    // Le nom du foyer n'est demandé que pour une inscription "fondatrice" ; en cas
    // d'invitation, le foyer existe déjà, donc on fournit une valeur factice qui passe la
    // validation mais n'est jamais utilisée.
    householdName: invite ? "-" : formData.get("householdName"),
    name: formData.get("name"),
    email: invite ? invite.email : formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { householdName, name, email, password } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { errors: { email: ["Un compte existe déjà avec cet email."] } };
  }

  const householdId = invite
    ? invite.householdId
    : (await prisma.household.create({ data: { name: householdName } })).id;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: invite ? "MEMBER" : "OWNER",
      householdId,
    },
  });

  if (invite) {
    await prisma.householdInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  }

  await createSession(user.id, user.role);
  redirect("/dashboard?welcome=1");
}

export async function login(state: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "Email ou mot de passe incorrect." };
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return { message: "Email ou mot de passe incorrect." };
  }

  await createSession(user.id, user.role);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
