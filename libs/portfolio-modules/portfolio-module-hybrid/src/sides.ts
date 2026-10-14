import type { Side } from "./types";

export const SIDES: readonly Side[] = ["local", "remote"];

export async function onBothSides<T>(
  run: (side: Side) => T | Promise<T>,
): Promise<Record<Side, T>> {
  const [local, remote] = await Promise.all([run("local"), run("remote")]);
  return { local, remote };
}

export function groupBySide<T>(items: readonly T[], sideOf: (item: T) => Side): Record<Side, T[]> {
  const groups: Record<Side, T[]> = { local: [], remote: [] };
  for (const item of items) groups[sideOf(item)].push(item);
  return groups;
}
