import { webFrame } from "electron";

export const setVisualZoomLevelLimits = (minimum: number, maximum: number): void => {
  webFrame.setVisualZoomLevelLimits(minimum, maximum);
};

export const getResourceUsage = (): Electron.ResourceUsage | undefined =>
  webFrame.getResourceUsage();
