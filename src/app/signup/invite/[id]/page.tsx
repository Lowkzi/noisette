import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SignupForm } from "../../SignupForm";

export default async function InviteSignupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invite = await prisma.householdInvite.findUnique({
    where: { id },
    include: { household: true },
  });

  if (!invite || invite.acceptedAt) {
    redirect("/signup");
  }

  return <SignupForm inviteId={invite.id} inviteEmail={invite.email} householdName={invite.household.name} />;
}
