import type { AddressParts } from "./splitAddress";

const SECOND_LINE_RATIO = 0.51;

/**
 * Where the middle of an address breaks to show it on two lines of about the same length, the
 * second one a little longer: what ends the first line, and what starts the second.
 */
export function splitMiddleForTwoLines(
  { start, middle, end }: AddressParts,
  ratio: number = SECOND_LINE_RATIO,
): readonly [string, string] {
  const total = start.length + middle.length + end.length;
  const firstLineLength = total - Math.ceil(total * ratio);
  const breakAt = Math.min(Math.max(firstLineLength - start.length, 0), middle.length);

  return [middle.slice(0, breakAt), middle.slice(breakAt)];
}
