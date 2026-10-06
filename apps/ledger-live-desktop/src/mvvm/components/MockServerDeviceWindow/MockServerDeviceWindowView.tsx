import React from "react";
import { MockServerDevice } from "@ledgerhq/device-mockserver-react";
import type { MockServerDeviceWindowViewModel } from "./types";

/**
 * Device-interaction modals disable pointer events on the body and dismiss on
 * any pointer-down reaching the document. The window opts out of both so the
 * device stays drivable under a modal.
 */
const keepModalsOpen = (event: React.PointerEvent<HTMLDivElement>) => event.stopPropagation();

/**
 * The window's header model icon draws in `currentColor` without a colour of
 * its own, and the app's body leaves text black, so it would vanish on the
 * dark header. `text-base` gives it the theme's text colour.
 */
const WRAPPER_CLASS_NAME = "pointer-events-auto text-base";

export interface MockServerDeviceWindowViewProps {
  readonly viewModel: MockServerDeviceWindowViewModel;
}

export function MockServerDeviceWindowView({ viewModel }: MockServerDeviceWindowViewProps) {
  if (!viewModel.isVisible) return null;

  return (
    <div className={WRAPPER_CLASS_NAME} onPointerDown={keepModalsOpen}>
      <MockServerDevice
        url={viewModel.url}
        token={viewModel.token}
        deviceId={viewModel.deviceId}
        floating
      />
    </div>
  );
}
