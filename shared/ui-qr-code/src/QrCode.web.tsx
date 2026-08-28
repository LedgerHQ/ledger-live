import React, { useEffect, useRef } from "react";
import { drawStyledQrCode } from "./qrCanvas.web";
import type { QrCodeProps } from "./types";

const DEFAULT_QR_CODE_SIZE = 200;

export function QrCode({
  value,
  size = DEFAULT_QR_CODE_SIZE,
  foregroundColor,
  centerContent,
  testID,
}: QrCodeProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasCenterContent = centerContent !== undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawStyledQrCode(canvas, value, size, hasCenterContent, foregroundColor);
  }, [value, size, hasCenterContent, foregroundColor]);

  return (
    <div data-testid={testID} className="relative flex items-center justify-center">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      {hasCenterContent ? (
        <div className="absolute inset-0 flex items-center justify-center">{centerContent}</div>
      ) : null}
    </div>
  );
}
