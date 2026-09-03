import { system } from "~/renderer/bridge";

/** Single chokepoint for `webFrame`. */

/** Pins the pinch-zoom range so the app cannot be zoomed by trackpad gestures. */
export const setVisualZoomLevelLimits = (minimum: number, maximum: number): void => {
  system.setVisualZoomLevelLimits(minimum, maximum);
};

export const getResourceUsage = (): Electron.ResourceUsage | undefined => system.getResourceUsage();
