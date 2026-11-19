const VISIBLE_START = 6;
const VISIBLE_END = 6;

export const initialOf = (name: string) => Array.from(name.trim())[0]?.toUpperCase() ?? "";

export function middleEllipsis(value: string): string {
  if (value.length <= VISIBLE_START + VISIBLE_END + 1) return value;
  return `${value.slice(0, VISIBLE_START)}…${value.slice(-VISIBLE_END)}`;
}
