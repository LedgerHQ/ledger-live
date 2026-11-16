export type DiffState = "none" | "added" | "removed";

export interface DiffLine {
  state: DiffState;
  text: string;
}

export const DIFF_SIGNS: Record<DiffState, string> = { added: "+", removed: "-", none: " " };

/** Past this many line pairs, the diff lists both sides instead of aligning them. */
export const MAX_DIFF_CELLS = 250_000;

const sameLine = (x: string, y: string) => x.trimEnd() === y.trimEnd();

const tagged = (state: DiffState) => (text: string) => ({ state, text });

/**
 * Lengths of the longest common subsequence of every pair of suffixes, flattened row by row:
 * `table[i * (n + 1) + j]` is the length for `before[i:]` and `after[j:]`.
 */
function suffixLcsTable(before: string[], after: string[]): Uint32Array {
  const width = after.length + 1;
  const table = new Uint32Array((before.length + 1) * width);
  for (let row = before.length - 1; row >= 0; row--) {
    for (let col = after.length - 1; col >= 0; col--) {
      const cell = row * width + col;
      table[cell] = sameLine(before[row], after[col])
        ? table[cell + width + 1] + 1
        : Math.max(table[cell + width], table[cell + 1]);
    }
  }
  return table;
}

/** Diffs two texts line by line, on their longest common subsequence. */
export function diffJsonLines(base: string, current: string): DiffLine[] {
  const before = base.split("\n");
  const after = current.split("\n");

  if (before.length * after.length > MAX_DIFF_CELLS) {
    return [...before.map(tagged("removed")), ...after.map(tagged("added"))];
  }

  const table = suffixLcsTable(before, after);
  const width = after.length + 1;
  const lines: DiffLine[] = [];
  let row = 0;
  let col = 0;
  while (row < before.length && col < after.length) {
    const cell = row * width + col;
    if (sameLine(before[row], after[col])) {
      lines.push({ state: "none", text: before[row] });
      row++;
      col++;
    } else if (table[cell + width] >= table[cell + 1]) {
      lines.push({ state: "removed", text: before[row++] });
    } else {
      lines.push({ state: "added", text: after[col++] });
    }
  }
  return [
    ...lines,
    ...before.slice(row).map(tagged("removed")),
    ...after.slice(col).map(tagged("added")),
  ];
}
