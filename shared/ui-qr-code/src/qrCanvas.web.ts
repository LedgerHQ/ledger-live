import qrcode from "qrcode";

const DOT_RADIUS_RATIO = 0.42;
const FINDER_MODULES = 7;
// Wide enough to keep a visible margin between the overlay and the closest dots for every QR version.
const CLEAR_ZONE_RATIO = 0.32;
const PADDING_RATIO = 0.06;
const FOREGROUND_COLOR = "#FFFFFF";

function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  moduleSize: number,
): void {
  ctx.fillStyle = FOREGROUND_COLOR;
  ctx.strokeStyle = FOREGROUND_COLOR;

  const outer = FINDER_MODULES * moduleSize;
  // Outer ring: a 1-module-thick rounded square stroke around the 7x7 finder.
  ctx.lineWidth = moduleSize;
  traceRoundedRect(
    ctx,
    x + moduleSize / 2,
    y + moduleSize / 2,
    outer - moduleSize,
    outer - moduleSize,
    moduleSize * 2,
  );
  ctx.stroke();
  // Inner 3x3 rounded square.
  traceRoundedRect(
    ctx,
    x + moduleSize * 2,
    y + moduleSize * 2,
    moduleSize * 3,
    moduleSize * 3,
    moduleSize,
  );
  ctx.fill();
}

// Module counts are always odd, so the cleared square needs an odd side too: with an even side it
// would sit half a module off-center while the overlay is centered on the canvas.
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

export function drawStyledQrCode(
  canvas: HTMLCanvasElement,
  value: string,
  size: number,
  hasCenterContent: boolean,
): void {
  const { modules } = qrcode.create(value, { errorCorrectionLevel: "H" });

  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    ctx = null;
  }
  if (!ctx) return;

  const count = modules.size;
  const { data } = modules;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const padding = size * PADDING_RATIO;
  const moduleSize = (size - padding * 2) / count;
  const dotRadius = moduleSize * DOT_RADIUS_RATIO;

  // Central square kept clear so the overlay sits on a clean background.
  const clearCount = hasCenterContent ? getClearCount(count) : 0;
  const clearStart = (count - clearCount) / 2;
  const clearEnd = clearStart + clearCount;

  ctx.fillStyle = FOREGROUND_COLOR;
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
      const cx = padding + col * moduleSize + moduleSize / 2;
      const cy = padding + row * moduleSize + moduleSize / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFinderPattern(ctx, padding, padding, moduleSize);
  drawFinderPattern(ctx, padding + (count - FINDER_MODULES) * moduleSize, padding, moduleSize);
  drawFinderPattern(ctx, padding, padding + (count - FINDER_MODULES) * moduleSize, moduleSize);
}
