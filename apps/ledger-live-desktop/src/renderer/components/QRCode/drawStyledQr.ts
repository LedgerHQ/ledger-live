import type qrcode from "qrcode";

/**
 * Paint a designer-styled QR code onto a canvas.
 *
 * The standard `qrcode` library only knows how to draw square modules.
 * The L4 Contacts dialog wants the softer "rounded dot" QR look you see
 * across most wallet apps, so we ask `qrcode` for the boolean matrix
 * (`qrcode.create(...)`) and paint it ourselves.
 *
 * The three finder patterns (the big 7×7 anchors in the top-left,
 * top-right and bottom-left corners) get a different treatment from
 * the data modules: instead of stacking 24 dots into the same shape we
 * draw a single rounded outer frame + a single rounded inner block.
 * That keeps the anchors visually clean and still scannable.
 *
 * Note: `roundRect` is part of the Canvas2D API since 2022 and is
 * available in Electron's bundled Chromium — no polyfill needed.
 *
 * Used by the L4 contact detail dialog only — the legacy `QRCode.tsx`
 * (Receive, WalletSync, …) keeps the square-module renderer.
 */

export type DrawStyledQrOptions = {
  /** Fill colour for the dark modules. Default: `#000`. */
  darkColor?: string;
  /**
   * Background fill. Default: `transparent` (leaves the host element's
   * background showing). Set to a colour when the canvas sits on a
   * non-white surface.
   */
  lightColor?: string;
  /**
   * Module corner radius as a fraction of the module size (0..1).
   *  - `0`   → square modules (legacy look)
   *  - `0.5` → full circles ("dotted" QR, the default here)
   *  - in-between → squircle
   */
  moduleRadiusPct?: number;
  /**
   * Outer corner radius for the three finder patterns, as a fraction
   * of the 7-module anchor size (0..1). Default: `0.3` (soft rounded
   * square — matches the dotted-data aesthetic without losing the
   * "anchor" silhouette scanners rely on).
   */
  eyeOuterRadiusPct?: number;
  /**
   * Inner block (3×3) corner radius for the finder patterns, as a
   * fraction of its own width. Default: `0.5` (full circle).
   */
  eyeInnerRadiusPct?: number;
};

/** Coordinates of the three finder pattern anchors. */
const finderTopLeftPositions = (matrixSize: number): ReadonlyArray<[number, number]> => [
  [0, 0],
  [0, matrixSize - 7],
  [matrixSize - 7, 0],
];

/**
 * Wrapper around `ctx.roundRect` with a path-based fallback for
 * environments that don't ship the (2022-vintage) Canvas2D API — most
 * notably jsdom, which the renderer's component tests run on. Modern
 * Electron and every supported browser have the native call.
 */
function addRoundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  // Polyfill: clamp the radius and stitch four quarter-arcs.
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * True when the module at (row, col) lies inside one of the three
 * 7×7 finder patterns — those are drawn separately via a stylised
 * outer-frame + inner-block, so we skip them when iterating the data
 * modules.
 */
function isInFinderPattern(row: number, col: number, matrixSize: number): boolean {
  const lastFinder = matrixSize - 7;
  return (
    (row < 7 && col < 7) ||
    (row < 7 && col >= lastFinder) ||
    (row >= lastFinder && col < 7)
  );
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  totalSize: number,
  outerRadiusPct: number,
  innerRadiusPct: number,
): void {
  const moduleSize = totalSize / 7;
  const outerR = totalSize * outerRadiusPct;
  // Subtract one module thickness so the frame keeps a uniform border.
  const innerR = Math.max(0, outerR - moduleSize);

  // Hollow frame: outer rounded rect + inner rounded rect path,
  // filled with the even-odd rule to subtract the inner from the outer.
  ctx.beginPath();
  addRoundRectPath(ctx,originX, originY, totalSize, totalSize, outerR);
  const innerSize = totalSize - 2 * moduleSize;
  addRoundRectPath(ctx,originX + moduleSize, originY + moduleSize, innerSize, innerSize, innerR);
  ctx.fill("evenodd");

  // Centre 3×3 rounded block.
  const centerSize = 3 * moduleSize;
  const centerR = (centerSize / 2) * innerRadiusPct;
  ctx.beginPath();
  addRoundRectPath(ctx,
    originX + 2 * moduleSize,
    originY + 2 * moduleSize,
    centerSize,
    centerSize,
    centerR,
  );
  ctx.fill();
}

export function drawStyledQr(
  canvas: HTMLCanvasElement,
  qr: ReturnType<typeof qrcode.create>,
  options: DrawStyledQrOptions = {},
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const {
    darkColor = "#000",
    lightColor = "transparent",
    moduleRadiusPct = 0.5,
    eyeOuterRadiusPct = 0.3,
    eyeInnerRadiusPct = 0.5,
  } = options;

  const { size, data } = qr.modules;
  const cellPx = canvas.width / size;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (lightColor !== "transparent") {
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = darkColor;

  // 1) Data modules — everything outside the three finder patterns.
  const moduleR = (cellPx / 2) * moduleRadiusPct;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!data[row * size + col]) continue;
      if (isInFinderPattern(row, col, size)) continue;
      ctx.beginPath();
      addRoundRectPath(ctx,col * cellPx, row * cellPx, cellPx, cellPx, moduleR);
      ctx.fill();
    }
  }

  // 2) Three finder patterns — stylised, drawn last so they sit on top
  //    cleanly if any data modules happen to overlap (shouldn't, but
  //    cheap insurance against rounding artifacts).
  for (const [row, col] of finderTopLeftPositions(size)) {
    drawFinderPattern(
      ctx,
      col * cellPx,
      row * cellPx,
      7 * cellPx,
      eyeOuterRadiusPct,
      eyeInnerRadiusPct,
    );
  }
}
