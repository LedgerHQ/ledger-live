import React, { useCallback, useEffect, useRef, useState } from "react";
import type { SpeculosAction } from "@ledgerhq/live-dmk-desktop";
import { cn } from "LLD/utils/cn";

interface Point {
  x: number;
  y: number;
}

export interface DeviceScreenImageProps {
  readonly src: string;
  /** Omitted on button-driven devices, which are not tappable. */
  readonly onTouch?: (x: number, y: number, action: SpeculosAction) => void;
}

/**
 * A still frame of the device screen. The PNG's own dimensions drive the aspect
 * ratio and the touch mapping, so every model is handled without a per-model
 * size table.
 *
 * Touches are sent as a press on pointer down and a release on pointer up, so
 * holding the mouse holds the finger — Stax and Flex gate their confirmations
 * behind exactly that.
 */
export function DeviceScreenImage({ src, onTouch }: DeviceScreenImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number>();
  const [undecodable, setUndecodable] = useState(false);

  /** Where the finger went down, so the release lands on the same spot. */
  const held = useRef<Point | null>(null);
  const touchRef = useRef(onTouch);
  touchRef.current = onTouch;

  useEffect(() => setUndecodable(false), [src]);

  const handleLoad = useCallback(() => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return;
    setAspectRatio(image.naturalWidth / image.naturalHeight);
  }, []);

  // A frame the browser cannot decode means the bytes were mangled in transit —
  // a mock server relaying the PNG as text does exactly that.
  const handleError = useCallback(() => setUndecodable(true), []);

  const toDevicePoint = useCallback(
    (event: React.PointerEvent<HTMLImageElement>): Point | null => {
      const image = imageRef.current;
      if (!image?.naturalWidth || !image.naturalHeight) return null;

      const rect = image.getBoundingClientRect();
      return {
        x: Math.round(((event.clientX - rect.left) / rect.width) * image.naturalWidth),
        y: Math.round(((event.clientY - rect.top) / rect.height) * image.naturalHeight),
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLImageElement>) => {
      if (!onTouch || held.current) return;
      const point = toDevicePoint(event);
      if (!point) return;

      // Capture so the release still arrives if the pointer wanders off the
      // image mid-hold; without it the device would stay pressed forever.
      imageRef.current?.setPointerCapture(event.pointerId);
      held.current = point;
      onTouch(point.x, point.y, "press");
    },
    [onTouch, toDevicePoint],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLImageElement>) => {
      const point = held.current;
      if (!onTouch || !point) return;

      held.current = null;
      imageRef.current?.releasePointerCapture(event.pointerId);
      onTouch(point.x, point.y, "release");
    },
    [onTouch],
  );

  // Unmounting mid-hold (collapsing the panel, disconnecting) would otherwise
  // leave the emulator with a finger down.
  useEffect(
    () => () => {
      const point = held.current;
      if (!point) return;
      held.current = null;
      touchRef.current?.(point.x, point.y, "release");
    },
    [],
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm bg-black",
        onTouch && !undecodable ? "cursor-pointer" : "cursor-default",
      )}
      style={{ aspectRatio: aspectRatio ?? 1 }}
    >
      <img
        ref={imageRef}
        src={src}
        alt="Device screen"
        draggable={false}
        onLoad={handleLoad}
        onError={handleError}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // Device screens are tiny; smoothing them turns text to mush. A hold
        // must not start a native image drag or a text selection either.
        className="block h-full w-full touch-none select-none object-contain [image-rendering:pixelated] [-webkit-user-drag:none]"
        data-testid="device-screen-image"
      />
      {undecodable && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-canvas-muted p-12 text-center"
          data-testid="device-screen-undecodable"
        >
          <span className="body-4 text-error">Screenshot could not be decoded</span>
          <span className="body-4 text-muted">
            The mock server may predate binary passthrough on its Speculos proxy.
          </span>
        </div>
      )}
    </div>
  );
}
