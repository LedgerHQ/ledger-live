import { useState, useCallback } from "react";
import { logDrawer } from "~/newArch/components/QueuedDrawer/utils/logDrawer";

const messageLog = "Follow Steps on device";

export const useManageKeyDrawer = () => {
  const [isDrawerVisible, setIsDrawerInstructionsVisible] = useState(false);

  const openDrawer = useCallback(() => {
    setIsDrawerInstructionsVisible(true);

    logDrawer(messageLog, "open");
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerInstructionsVisible(false);
    logDrawer(messageLog, "close");
  }, []);

  return {
    isDrawerVisible,
    openDrawer,
    closeDrawer,
  };
};
