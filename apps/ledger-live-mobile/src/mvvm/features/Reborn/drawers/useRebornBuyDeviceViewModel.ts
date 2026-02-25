import { useCallback } from "react";
import { useRebornBuyDeviceDrawerController } from "../hooks/useRebornBuyDeviceDrawerController";

function useRebornBuyDeviceViewModel() {
  const { isOpen, closeDrawer } = useRebornBuyDeviceDrawerController();

  const handleClose = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  return {
    handleClose,
    isOpen,
  };
}

export default useRebornBuyDeviceViewModel;
