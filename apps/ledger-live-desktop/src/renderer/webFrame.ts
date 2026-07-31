import electron from "electron";

/**
 * Single chokepoint for Electron `webFrame` access from the renderer.
 *
 * Named after the Electron module it wraps rather than after a feature, so it maps 1:1
 * onto the surface that will later be exposed across the context bridge.
 */
let webFrame: Electron.WebFrame | undefined;
if (!process.env.STORYBOOK_ENV) {
  webFrame = electron.webFrame;
}

/** Pins the pinch-zoom range so the app cannot be zoomed by trackpad gestures. */
export const setVisualZoomLevelLimits = (minimum: number, maximum: number): void => {
  webFrame?.setVisualZoomLevelLimits(minimum, maximum);
};

/** Renderer memory/resource counters, attached to exported logs for diagnostics. */
export const getResourceUsage = (): Electron.ResourceUsage | undefined =>
  webFrame?.getResourceUsage();
