"use client";

import { removeMember } from "@/app/actions/household";

export function RemoveMemberButton({ memberId }: { memberId: string }) {
  return (
    <form
      action={async () => {
        if (confirm("Retirer ce membre du foyer ?")) {
          await removeMember(memberId);
        }
      }}
    >
      <button type="submit" className="text-xs text-red-400 hover:text-red-300">
        Retirer
      </button>
    </form>
  );
}
