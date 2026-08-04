import { prisma } from "@/lib/prisma";
import { getHouseholdId, getUser } from "@/lib/dal";
import { InviteMemberForm } from "./InviteMemberForm";
import { RemoveMemberButton } from "./RemoveMemberButton";

export default async function FoyerPage() {
  const householdId = await getHouseholdId();
  const user = await getUser();
  if (!householdId || !user) return <p className="text-slate-500">Foyer introuvable.</p>;

  const [household, members, pendingInvites] = await Promise.all([
    prisma.household.findUnique({ where: { id: householdId } }),
    prisma.user.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } }),
    prisma.householdInvite.findMany({
      where: { householdId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{household?.name ?? "Foyer"}</h1>

      {user.role === "OWNER" && <InviteMemberForm />}

      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-slate-400">Membres</h2>
        {members.map((m) => (
          <div
            key={m.id}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{m.name ?? m.email}</p>
              <p className="text-xs text-slate-400">
                {m.email} · {m.role === "OWNER" ? "Propriétaire" : "Membre"}
              </p>
            </div>
            {user.role === "OWNER" && m.id !== user.id && <RemoveMemberButton memberId={m.id} />}
          </div>
        ))}
      </div>

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-slate-400">Invitations en attente</h2>
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="bg-slate-800/30 border border-slate-800 rounded-xl p-3 text-sm">
              {invite.email} — <span className="text-slate-500">/signup/invite/{invite.id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
