import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { context } from "~/renderer/drawers/Provider";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/reducers/originFlow";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import useBuyDeviceDialog from "LLD/features/BuyDevice/hooks/useBuyDeviceDialog";

/**
 * Handler for the "My Ledger" sidebar entry only: without an onboarded
 * device, opens the Buy Device dialog and does not navigate; otherwise navigates
 * to /manager and tracks. Use only where the My Ledger nav action is defined.
 */
export function useNavigateToMyLedger(
  push: (path: string) => void,
  trackEntry: (entry: string, flagged?: boolean) => void,
) {
  const dispatch = useDispatch();
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { setDrawer } = useContext(context);
  const { handleOpen: openBuyDeviceModal } = useBuyDeviceDialog();

  return useCallback(() => {
    trackEntry("manager");
    dispatch(setOriginFlow(HOOKS_TRACKING_LOCATIONS.managerDashboard));
    if (!hasOnboardedDevice) {
      setDrawer();
      openBuyDeviceModal();
      return;
    }
    push("/manager");
  }, [dispatch, hasOnboardedDevice, setDrawer, openBuyDeviceModal, push, trackEntry]);
}
