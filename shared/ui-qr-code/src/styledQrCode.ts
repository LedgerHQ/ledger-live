import qrcode from "qrcode";

const DOT_RADIUS_RATIO = 0.42;
export const FINDER_MODULES = 7;
const CLEAR_ZONE_RATIO = 0.32;

type StyledQrCodeDot = Readonly<{
  cx: number;
  cy: number;
  radius: number;
}>;

type StyledQrCodeFinder = Readonly<{
  x: number;
  y: number;
  moduleSize: number;
}>;

export type StyledQrCode = Readonly<{
  dots: readonly StyledQrCodeDot[];
  finders: readonly StyledQrCodeFinder[];
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

export function createStyledQrCode(
  value: string,
  size: number,
  hasCenterContent: boolean,
): StyledQrCode {
  const { modules } = qrcode.create(value, { errorCorrectionLevel: "H" });
  const { data, size: count } = modules;
  const moduleSize = size / count;
  const clearCount = hasCenterContent ? getClearCount(count) : 0;
  const clearStart = (count - clearCount) / 2;
  const clearEnd = clearStart + clearCount;
  const dots: StyledQrCodeDot[] = [];

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (isInFinderPattern(row, col, count)) continue;
      if (
        clearCount > 0 &&
        row >= clearStart &&
        row < clearEnd &&
        col >= clearStart &&
        col < clearEnd
      ) {
        continue;
      }
      if (!data[row * count + col]) continue;

      dots.push({
        cx: col * moduleSize + moduleSize / 2,
        cy: row * moduleSize + moduleSize / 2,
        radius: moduleSize * DOT_RADIUS_RATIO,
      });
    }
  }

  return {
    dots,
    finders: [
      { x: 0, y: 0, moduleSize },
      {
        x: (count - FINDER_MODULES) * moduleSize,
        y: 0,
        moduleSize,
      },
      {
        x: 0,
        y: (count - FINDER_MODULES) * moduleSize,
        moduleSize,
      },
    ],
  };
}
