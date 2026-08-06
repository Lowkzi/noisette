export const PIE_PALETTE = ["#16a34a", "#38bdf8", "#a78bfa", "#f472b6", "#34d399", "#fb7185", "#facc15", "#60a5fa"];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export function buildPieSlices(entries: { name: string; amount: number }[]) {
  const total = entries.reduce((s, e) => s + e.amount, 0);
  let cumulativeAngle = 0;
  return entries.map((e, i) => {
    const angle = total > 0 ? (e.amount / total) * 360 : 0;
    const path = arcPath(100, 100, 90, cumulativeAngle, cumulativeAngle + angle);
    cumulativeAngle += angle;
    return { name: e.name, amount: e.amount, path, color: PIE_PALETTE[i % PIE_PALETTE.length], total };
  });
}
