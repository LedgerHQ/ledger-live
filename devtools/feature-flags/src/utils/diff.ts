export type DiffState = "none" | "added" | "removed";

export interface DiffLine {
  state: DiffState;
  text: string;
}

/**
 * Applies consistent JSON stringification for both sides of a diff.
 *
 * @param value - The value to stringify.
 * @return The value stringified with a fixed indentation.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/**
 * Diffs two JSON strings line by line.
 *
 * @param base - The original side of the diff.
 * @param current - The edited side of the diff.
 * @return Each line tagged as unchanged, removed, or added, in display order.
 */
export function diffJsonLines(base: string, current: string): DiffLine[] {
  const a = base.split("\n");
  const b = current.split("\n");
  const m = a.length;
  const n = b.length;

  const eq = (x: string, y: string) => x.trimEnd() === y.trimEnd();

  const lcs = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] = eq(a[i], b[j]) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (eq(a[i], b[j])) {
      out.push({ state: "none", text: a[i++] });
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ state: "removed", text: a[i++] });
    } else {
      out.push({ state: "added", text: b[j++] });
    }
  }
  while (i < m) out.push({ state: "removed", text: a[i++] });
  while (j < n) out.push({ state: "added", text: b[j++] });
  return out;
}
