/** What the footer says about the saved changes the next `reload` applies. */
export function pendingLabel(pendingCount: number, reload: "reload" | "restart") {
  if (pendingCount === 1) return `1 saved change applies after a ${reload}.`;
  return `${pendingCount} saved changes apply after a ${reload}.`;
}
