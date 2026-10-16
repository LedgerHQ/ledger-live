import type { Side } from "./types";

export const SIDES: readonly Side[] = ["local", "remote"];

export async function onBothSides<T>(
  run: (side: Side) => T | Promise<T>,
): Promise<Record<Side, T>> {
  const [local, remote] = await Promise.all([run("local"), run("remote")]);
  return { local, remote };
}

/** Each side's items, in order: an item goes to every side `sidesOf` names. */
export async function groupBySides<T>(
  items: readonly T[],
  sidesOf: (item: T) => Promise<readonly Side[]>,
): Promise<Record<Side, T[]>> {
  const routed = await Promise.all(items.map(async item => ({ item, sides: await sidesOf(item) })));
  const groups: Record<Side, T[]> = { local: [], remote: [] };
  for (const { item, sides } of routed) {
    for (const side of sides) groups[side].push(item);
  }
  return groups;
}
