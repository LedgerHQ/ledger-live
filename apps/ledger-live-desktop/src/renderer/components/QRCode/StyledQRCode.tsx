import React, { useEffect, useRef } from "react";
import qrcode from "qrcode";
import { drawStyledQr, type DrawStyledQrOptions } from "./drawStyledQr";

/**
 * React wrapper for the designer-styled QR renderer (rounded modules
 * + stylised finder patterns).
 *
 * Mirrors the prop surface of the legacy class-based `QRCode.tsx` so
 * callers can swap with minimal churn: `data` + `size`. Optional
 * styling knobs forward to {@link drawStyledQr}.
 *
 * The matrix is generated with error-correction level `"H"` (~30 %
 * redundancy) — the L4 dialog overlays a crypto icon on the centre
 * AND uses rounded modules; both eat into scanner margin, so the
 * highest correction level keeps the QR robust.
 */
type Props = {
  /** Payload to encode — typically a 0x address or URI. */
  data: string;
  /** Logical pixel size of the rendered QR (CSS px). Defaults to 200. */
  size?: number;
} & DrawStyledQrOptions;

const DEFAULT_SIZE = 200;

export function StyledQRCode({
  data,
  size = DEFAULT_SIZE,
  darkColor,
  lightColor,
  moduleRadiusPct,
  eyeOuterRadiusPct,
  eyeInnerRadiusPct,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const qr = qrcode.create(data, { errorCorrectionLevel: "H" });
    drawStyledQr(canvas, qr, {
      darkColor,
      lightColor,
      moduleRadiusPct,
      eyeOuterRadiusPct,
      eyeInnerRadiusPct,
    });
  }, [data, size, darkColor, lightColor, moduleRadiusPct, eyeOuterRadiusPct, eyeInnerRadiusPct]);

  // Up-scale the canvas buffer for HiDPI displays so the rounded
  // modules stay crisp at any zoom level. CSS keeps the logical size
  // pinned to the `size` prop.
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const bufferPx = size * dpr;

  return (
    <canvas
      ref={canvasRef}
      width={bufferPx}
      height={bufferPx}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
