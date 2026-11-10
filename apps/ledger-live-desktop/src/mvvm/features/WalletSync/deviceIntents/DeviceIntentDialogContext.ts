import { createContext, useContext, useEffect } from "react";

/** Tells the Wallet Sync drawer whether a device intent dialog is open over it. */
export const DeviceIntentDialogContext = createContext<(isOpen: boolean) => void>(() => undefined);

/** Marks a device intent dialog as open while the calling component is mounted. */
export function useDeviceIntentDialogOpen() {
  const setDialogOpen = useContext(DeviceIntentDialogContext);
  useEffect(() => {
    setDialogOpen(true);
    return () => setDialogOpen(false);
  }, [setDialogOpen]);
}
