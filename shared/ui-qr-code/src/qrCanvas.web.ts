import { createStyledQrCode, FINDER_MODULES } from "./styledQrCode";

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
  foregroundColor: string,
): void {
  ctx.fillStyle = foregroundColor;
  ctx.strokeStyle = foregroundColor;

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

export function drawStyledQrCode(
  canvas: HTMLCanvasElement,
  value: string,
  size: number,
  hasCenterContent: boolean,
  foregroundColor = FOREGROUND_COLOR,
): void {
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    ctx = null;
  }
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const styledQrCode = createStyledQrCode(value, size, hasCenterContent);

  ctx.fillStyle = foregroundColor;
  for (const { cx, cy, radius } of styledQrCode.dots) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const { x, y, moduleSize } of styledQrCode.finders) {
    drawFinderPattern(ctx, x, y, moduleSize, foregroundColor);
  }
}
