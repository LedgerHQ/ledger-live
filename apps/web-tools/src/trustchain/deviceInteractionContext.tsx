import { createContext, useContext } from "react";

export const DeviceInteractionVisibleContext = createContext(false);

export function useDeviceInteractionVisible() {
  return useContext(DeviceInteractionVisibleContext);
}
