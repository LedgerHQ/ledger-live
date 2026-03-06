import { useContext, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { context } from "~/renderer/drawers/Provider";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import useBuyDeviceDialog from "LLD/features/BuyDevice/hooks/useBuyDeviceDialog";
import { closeBuyDevice } from "LLD/features/BuyDevice/buyDeviceDialog";

/**
 * When user has no onboarded device and no device connected (and is not on a device-setup
 * route), opens the Buy Device modal and returns false so the caller can return null.
 * Otherwise returns true (show the device action content).
 */
export function useBuyDeviceIntercept(): boolean {
  const device = useSelector(getCurrentDevice);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const { setDrawer } = useContext(context);
  const { handleOpen: openBuyDeviceModal } = useBuyDeviceDialog();
  const didOpenRef = useRef(false);

  const isDeviceSetupRoute = pathname.includes("onboarding") || pathname.includes("recover");
  const shouldShowContent = hasOnboardedDevice || !!device || isDeviceSetupRoute;

  useEffect(() => {
    if (shouldShowContent) {
      dispatch(closeBuyDevice());
    } else if (!didOpenRef.current) {
      didOpenRef.current = true;
      setDrawer();
      dispatch(setDrawerVisibility(false));
      openBuyDeviceModal();
    }
  }, [shouldShowContent, dispatch, setDrawer, openBuyDeviceModal]);

  return shouldShowContent;
}
