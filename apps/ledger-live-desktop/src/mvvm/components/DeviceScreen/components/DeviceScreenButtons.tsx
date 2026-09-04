import React, { useCallback, useEffect, useRef } from "react";
import type { SpeculosAction, SpeculosButton } from "@ledgerhq/live-dmk-desktop";

const BUTTONS: { button: SpeculosButton; label: string }[] = [
  { button: "left", label: "Left" },
  { button: "both", label: "Both" },
  { button: "right", label: "Right" },
];

const isActivationKey = (key: string) => key === " " || key === "Enter";

export interface DeviceScreenButtonsProps {
  readonly onPress: (button: SpeculosButton, action: SpeculosAction) => void;
}

/**
 * The physical buttons of a button-driven device, held for as long as the
 * pointer or key is down, since some flows require a long press.
 */
export function DeviceScreenButtons({ onPress }: DeviceScreenButtonsProps) {
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

  return (
    <div className="flex justify-center gap-6">
      {BUTTONS.map(({ button, label }) => (
        <button
          key={button}
          type="button"
          // Capture so the release still arrives if the pointer wanders off.
          onPointerDown={event => {
            event.currentTarget.setPointerCapture(event.pointerId);
            hold(button);
          }}
          onPointerUp={release}
          onPointerCancel={release}
          // Keyboard activation fires no pointer events.
          onKeyDown={event => {
            if (!isActivationKey(event.key)) return;
            event.preventDefault();
            hold(button);
          }}
          onKeyUp={event => isActivationKey(event.key) && release()}
          className="body-4 flex-1 touch-none select-none rounded-sm bg-muted py-6 text-base hover:bg-muted-hover active:bg-active"
          data-testid={`device-screen-button-${button}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
