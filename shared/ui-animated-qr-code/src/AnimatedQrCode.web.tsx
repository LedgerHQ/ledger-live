import React, { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { getQrElementFrame, NEVER_PRESSED, toRgbString, type QrElement } from "./animationTimeline";
import { createQrMatrix } from "./qrMatrix";
import { drawAnimatedQrFrame, isQrMoving } from "./qrCanvas";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { usePressCount } from "./usePressCount";
import type { AnimatedQrCodeProps } from "./types";

// Share of the clear center the badge covers, leaving a margin of white around it.
const CENTER_DIAMETER_RATIO = 0.75;
const CENTER: QrElement = { x: 0.5, y: 0.5, kind: "center" };
// The timeline runs in seconds.
const now = () => performance.now() / 1000;

const fill: CSSProperties = { position: "absolute", inset: 0 };

/**
 * QR code drawn on a canvas and animated on the same timeline as the native views: a shimmer while
 * loading, a ripple on each press. The frame loop only runs while something moves. The center
 * content is a React node, animated in the same loop.
 */
export function AnimatedQrCode({
  value,
  size,
  animation,
  centerContent,
  onPress,
  accessibilityLabel,
  triggerKey = 0,
  testID,
}: AnimatedQrCodeProps): React.JSX.Element {
  const animated = !usePrefersReducedMotion();
  const hasCenter = centerContent !== undefined && centerContent !== null;
  const matrix = useMemo(() => createQrMatrix(value, hasCenter), [value, hasCenter]);
  // The skeleton has nothing to ripple.
  const { pressCount, press } = usePressCount(triggerKey, animated && animation !== "loading");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pressedAt = useRef(NEVER_PRESSED);
  const playedPressCount = useRef(pressCount);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    // A new count plays one press; a count from before the mount, or while loading, plays nothing.
    if (pressCount !== playedPressCount.current) {
      playedPressCount.current = pressCount;
      if (animated && animation === "ripple") pressedAt.current = now();
    }

    const paint = (time: number) => {
      drawAnimatedQrFrame(ctx, { matrix, size, animation, time, pressedAt: pressedAt.current });
      const { scale, color } = getQrElementFrame(animation, time, CENTER, pressedAt.current);
      if (placeholderRef.current) placeholderRef.current.style.backgroundColor = toRgbString(color);
      if (contentRef.current) contentRef.current.style.transform = `scale(${scale})`;
    };

    if (!animated) {
      // A ripple cut short by reduced motion must not resume when motion comes back.
      pressedAt.current = NEVER_PRESSED;
      paint(0);
      return;
    }
    let frame = 0;
    const tick = () => {
      const time = now();
      paint(time);
      if (isQrMoving(animation, time, pressedAt.current)) frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [matrix, size, animation, animated, pressCount]);

  const diameter = matrix.clearCount * (size / matrix.moduleCount) * CENTER_DIAMETER_RATIO;
  const offset = (size - diameter) / 2;
  const loading = animation === "loading";
  // The ink is a fixed dark on white, so the code stays readable on a dark screen.
  const paper: CSSProperties = {
    position: "relative",
    display: "block",
    width: size,
    height: size,
    padding: 0,
    border: 0,
    backgroundColor: "#ffffff",
  };
  const content = (
    <>
      <canvas ref={canvasRef} style={{ ...fill, width: size, height: size }} aria-hidden />
      {hasCenter && (
        <div
          aria-hidden={loading}
          style={{
            position: "absolute",
            left: offset,
            top: offset,
            width: diameter,
            height: diameter,
            pointerEvents: "none",
          }}
        >
          <div
            ref={placeholderRef}
            style={{ ...fill, borderRadius: "50%", opacity: loading ? 1 : 0 }}
          />
          <div
            ref={contentRef}
            style={{
              ...fill,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0 : 1,
            }}
          >
            {centerContent}
          </div>
        </div>
      )}
    </>
  );

  if (!onPress) {
    return (
      <div data-testid={testID} style={paper}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-testid={testID}
      aria-label={accessibilityLabel}
      style={{ ...paper, cursor: "pointer" }}
      onClick={() => {
        press();
        onPress();
      }}
    >
      {content}
    </button>
  );
}
