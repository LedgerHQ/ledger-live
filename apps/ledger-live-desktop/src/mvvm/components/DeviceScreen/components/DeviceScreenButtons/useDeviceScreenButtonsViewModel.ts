import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import type { SpeculosAction, SpeculosButton } from "@ledgerhq/live-dmk-desktop";

export type DeviceScreenButtonPress = (button: SpeculosButton, action: SpeculosAction) => void;

const BUTTONS: { button: SpeculosButton; label: string }[] = [
  { button: "left", label: "Left" },
  { button: "both", label: "Both" },
  { button: "right", label: "Right" },
];

const isActivationKey = (key: string) => key === " " || key === "Enter";

/**
 * Drives the physical buttons of a button-driven device: each is held for as
 * long as the pointer or key is down, since some flows require a long press.
 */
export function useDeviceScreenButtonsViewModel(onPress: DeviceScreenButtonPress) {
  const held = useRef<SpeculosButton | null>(null);
  const pressRef = useRef(onPress);
  pressRef.current = onPress;

  const hold = useCallback((button: SpeculosButton) => {
    if (held.current) return;
    held.current = button;
    pressRef.current(button, "press");
  }, []);

  const release = useCallback(() => {
    const button = held.current;
    if (!button) return;
    held.current = null;
    pressRef.current(button, "release");
  }, []);

  // Never leave a button down if the row disappears mid-hold.
  useEffect(() => release, [release]);

  const handlePointerDown = useCallback(
    (button: SpeculosButton, event: React.PointerEvent<HTMLButtonElement>) => {
      // Capture so the release still arrives if the pointer wanders off.
      event.currentTarget.setPointerCapture(event.pointerId);
      hold(button);
    },
    [hold],
  );

  // Keyboard activation fires no pointer events.
  const handleKeyDown = useCallback(
    (button: SpeculosButton, event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!isActivationKey(event.key)) return;
      event.preventDefault();
      hold(button);
    },
    [hold],
  );

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isActivationKey(event.key)) release();
    },
    [release],
  );

  return {
    buttons: BUTTONS,
    handlePointerDown,
    handleRelease: release,
    handleKeyDown,
    handleKeyUp,
  };
}

export type DeviceScreenButtonsViewModel = ReturnType<typeof useDeviceScreenButtonsViewModel>;
