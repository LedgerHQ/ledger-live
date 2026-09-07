import React from "react";
import type { DeviceScreenButtonsViewModel } from "./useDeviceScreenButtonsViewModel";

export function DeviceScreenButtonsView({
  buttons,
  handlePointerDown,
  handleRelease,
  handleKeyDown,
  handleKeyUp,
}: DeviceScreenButtonsViewModel) {
  return (
    <div className="flex justify-center gap-6">
      {buttons.map(({ button, label }) => (
        <button
          key={button}
          type="button"
          onPointerDown={event => handlePointerDown(button, event)}
          onPointerUp={handleRelease}
          onPointerCancel={handleRelease}
          onKeyDown={event => handleKeyDown(button, event)}
          onKeyUp={handleKeyUp}
          className="body-4 flex-1 touch-none select-none rounded-sm bg-muted py-6 text-base hover:bg-muted-hover active:bg-active"
          data-testid={`device-screen-button-${button}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
