import { Device } from "@ledgerhq/types-devices";
import { useState, useCallback } from "react";
import { logDrawer } from "~/newArch/components/QueuedDrawer/utils/logDrawer";

const messageLog = "Follow Steps on device";

export const useFollowInstructions = () => {
  const [isDrawerInstructionsVisible, setIsDrawerInstructionsVisible] = useState(false);

  const openDrawer = useCallback((_device: Device) => {
    setIsDrawerInstructionsVisible(true);
    logDrawer(messageLog, "open");
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerInstructionsVisible(false);
    logDrawer(messageLog, "close");
  }, []);

  return {
    isDrawerInstructionsVisible,
    openDrawer,
    closeDrawer,
  };
};
