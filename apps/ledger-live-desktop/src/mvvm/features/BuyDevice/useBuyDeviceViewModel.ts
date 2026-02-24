import { useSelector, useDispatch } from "LLD/hooks/redux";
import { closeBuyDevice, selectIsBuyDeviceOpen } from "./buyDeviceDialog";
import { useCallback } from "react";
import useLazyOnboardingActions from "LLD/hooks/useLazyOnboardingActions";

export interface BuyDeviceViewProps {
  isOpen: boolean;
  onClose?: () => void | undefined;
  handleConnect: () => void;
  handleBuy: () => void;
}

const useBuyDeviceViewModel = (): BuyDeviceViewProps => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsBuyDeviceOpen);
  const { handleBuyDevice, handleConnect: handleConnectDevice } = useLazyOnboardingActions();

  const onClose = useCallback(() => {
    dispatch(closeBuyDevice());
  }, [dispatch]);

  const handleBuy = useCallback(() => {
    handleBuyDevice();
    onClose();
  }, [onClose, handleBuyDevice]);

  const handleConnect = useCallback(() => {
    handleConnectDevice();
    onClose();
  }, [onClose, handleConnectDevice]);

  return {
    isOpen,
    onClose,
    handleConnect,
    handleBuy,
  };
};

export default useBuyDeviceViewModel;
