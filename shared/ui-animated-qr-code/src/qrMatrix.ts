import qrcode from "qrcode";

export const FINDER_MODULES = 7;
const CLEAR_ZONE_RATIO = 0.32;
// `qrcode` throws on an empty value, e.g. an address still loading. This one has an address's
// length and mixed case, which `qrcode` cannot pack denser, so the skeleton gets a typical density.
const EMPTY_VALUE_PLACEHOLDER = `0x${"aB".repeat(20)}`;

export type QrCell = Readonly<{ row: number; col: number }>;

export type QrMatrix = Readonly<{
  moduleCount: number;
  dots: readonly QrCell[];
  clearStart: number;
  clearCount: number;
}>;

function getClearCount(count: number): number {
  const raw = Math.round(count * CLEAR_ZONE_RATIO);
  return raw % 2 === count % 2 ? raw : raw + 1;
}

function isInFinderPattern(row: number, col: number, count: number): boolean {
  const top = row < FINDER_MODULES;
  const bottom = row >= count - FINDER_MODULES;
  const left = col < FINDER_MODULES;
  const right = col >= count - FINDER_MODULES;
  return (top && left) || (top && right) || (bottom && left);
}

/**
 * Dark modules outside the finders and, with `withClearCenter`, outside a clear zone in the middle
 * for center content. Error correction H keeps the code readable with that zone empty.
 */
export function createQrMatrix(value: string, withClearCenter: boolean): QrMatrix {
  const { modules } = qrcode.create(value || EMPTY_VALUE_PLACEHOLDER, {
    errorCorrectionLevel: "H",
  });
  const { data, size: count } = modules;
  const clearCount = withClearCenter ? getClearCount(count) : 0;
  const clearStart = (count - clearCount) / 2;
  const clearEnd = clearStart + clearCount;
  const dots: QrCell[] = [];

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (isInFinderPattern(row, col, count)) continue;
      const inClearZone =
        row >= clearStart && row < clearEnd && col >= clearStart && col < clearEnd;
      if (inClearZone || !data[row * count + col]) continue;
      dots.push({ row, col });
    }
  }

  return {
    moduleCount: count,
    dots,
    clearStart,
    clearCount,
  };
}
