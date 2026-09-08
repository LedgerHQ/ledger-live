import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import type { SpeculosAction } from "@ledgerhq/live-dmk-desktop";

interface Point {
  x: number;
  y: number;
}

export type DeviceScreenTouch = (x: number, y: number, action: SpeculosAction) => void;

/**
 * Round a ratio of a frame's own dimension to a device pixel, clamped to the
 * screen: rounding at the very edge of the image otherwise yields `size` or a
 * negative value, and Speculos is sent a point that is not on the screen.
 */
const toPixelIndex = (value: number, size: number): number =>
  Math.min(Math.max(Math.round(value), 0), size - 1);

/**
 * Drives a still frame of the device screen: the frame's own dimensions give
 * the aspect ratio and map a tap to device pixels, so every model is handled
 * without a per-model size table.
 *
 * Touches are sent as a press on pointer down and a release on pointer up, so
 * holding the mouse holds the finger — Stax and Flex gate their confirmations
 * behind exactly that.
 */
export function useDeviceScreenImageViewModel(src: string, onTouch?: DeviceScreenTouch) {
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

  const toDevicePoint = useCallback((event: React.PointerEvent<HTMLImageElement>): Point | null => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return null;

    const rect = image.getBoundingClientRect();
    return {
      x: toPixelIndex(
        ((event.clientX - rect.left) / rect.width) * image.naturalWidth,
        image.naturalWidth,
      ),
      y: toPixelIndex(
        ((event.clientY - rect.top) / rect.height) * image.naturalHeight,
        image.naturalHeight,
      ),
    };
  }, []);

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

  return {
    imageRef,
    aspectRatio,
    undecodable,
    tappable: Boolean(onTouch) && !undecodable,
    handleLoad,
    handleError,
    handlePointerDown,
    handlePointerUp,
  };
}

export type DeviceScreenImageViewModel = Readonly<ReturnType<typeof useDeviceScreenImageViewModel>>;
