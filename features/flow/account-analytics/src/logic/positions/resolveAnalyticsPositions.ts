export function resolveAnalyticsPositions<Position extends Readonly<{ id: string }>>(
  positionIds: readonly string[],
  positions: readonly Position[],
): Position[] | undefined {
  const byId = new Map(positions.map(position => [position.id, position]));
  const selected: Position[] = [];
  for (const id of positionIds) {
    const position = byId.get(id);
    if (!position) return undefined;
    selected.push(position);
  }
  return selected;
}
