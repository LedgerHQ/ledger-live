import { system } from "~/renderer/bridge";

export const setVisualZoomLevelLimits = (minimum: number, maximum: number): void => {
  system.setVisualZoomLevelLimits(minimum, maximum);
};

export const getResourceUsage = (): Electron.ResourceUsage | undefined => system.getResourceUsage();
