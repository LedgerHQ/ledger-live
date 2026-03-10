import { useSelector, useDispatch } from "LLD/hooks/redux";
import { closeBuyDevice, selectIsBuyDeviceOpen } from "./buyDeviceDialog";
import { useCallback, useEffect } from "react";
import { useLazyOnboardingActions } from "LLD/hooks/useLazyOnboardingActions";
import { track } from "~/renderer/analytics/segment";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { selectOriginFlow } from "~/renderer/reducers/originFlow";

export interface BuyDeviceViewProps {
  isOpen: boolean;
  onClose: () => void;
  handleConnect: () => void;
  handleBuy: () => void;
}

const ANALYTICS_PAGE = "buy device dialog";

const useBuyDeviceViewModel = (): BuyDeviceViewProps => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsBuyDeviceOpen);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const trigger = useSelector(selectOriginFlow);
  const { handleBuyDevice, handleConnect: handleConnectDevice } = useLazyOnboardingActions();

  useEffect(() => {
    if (hasOnboardedDevice && isOpen) {
      dispatch(closeBuyDevice());
    }
  }, [hasOnboardedDevice, isOpen, dispatch]);

  useEffect(() => {
    if (isOpen) {
      track("modal_shown", { modal: "BuyDeviceModal", trigger });
    }
  }, [isOpen, trigger]);

  const onClose = useCallback(() => {
    dispatch(closeBuyDevice());
  }, [dispatch]);

  const handleBuy = useCallback(() => {
    track("button_clicked", {
      button: "buy a ledger device",
      page: ANALYTICS_PAGE,
    });
    handleBuyDevice();
    onClose();
  }, [onClose, handleBuyDevice]);

  const handleConnect = useCallback(() => {
    track("button_clicked", {
      button: "Connect",
      page: ANALYTICS_PAGE,
    });
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
