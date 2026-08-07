const MEMBER_COLORS = ["#22c55e", "#0ea5e9", "#f59e0b", "#a78bfa", "#f43f5e", "#38bdf8", "#facc15"];

// Couleur stable par membre, dérivée de son id, pour des badges cohérents à travers l'app sans
// dépendre de l'ordre d'affichage.
export function memberColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return MEMBER_COLORS[hash % MEMBER_COLORS.length];
}
