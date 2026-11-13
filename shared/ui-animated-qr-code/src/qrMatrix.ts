import qrcode from "qrcode";

export const FINDER_MODULES = 7;
const CLEAR_ZONE_RATIO = 0.32;

export type QrCell = Readonly<{ row: number; col: number }>;

export type QrMatrix = Readonly<{
  moduleCount: number;
  dots: readonly QrCell[];
  finders: readonly QrCell[];
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

/** Dark modules outside the finders and the center clear zone, which holds the center badge. */
export function createQrMatrix(value: string): QrMatrix {
  const { modules } = qrcode.create(value, { errorCorrectionLevel: "H" });
  const { data, size: count } = modules;
  const clearCount = getClearCount(count);
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
    finders: [
      { row: 0, col: 0 },
      { row: 0, col: count - FINDER_MODULES },
      { row: count - FINDER_MODULES, col: 0 },
    ],
    clearStart,
    clearCount,
  };
}

/** Center of a module, in fractions of the QR side. */
export function getModuleCenter(index: number, moduleCount: number): number {
  return (index + 0.5) / moduleCount;
}

export const FINDER_CENTER_OFFSET = (FINDER_MODULES - 1) / 2;
