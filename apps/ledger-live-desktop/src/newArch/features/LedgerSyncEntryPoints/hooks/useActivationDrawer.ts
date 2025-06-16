import { resetWalletSync, setDrawerVisibility } from "~/renderer/actions/walletSync";
import {
  AnalyticsFlow,
  StepsOutsideFlow,
  useLedgerSyncAnalytics,
} from "../../WalletSync/hooks/useLedgerSyncAnalytics";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { walletSyncFakedSelector, walletSyncStepSelector } from "~/renderer/reducers/walletSync";
import { useFlows } from "../../WalletSync/hooks/useFlows";

export function useActivationDrawer() {
  const dispatch = useDispatch();
  const { goToWelcomeScreenWalletSync } = useFlows();
  const hasBeenFaked = useSelector(walletSyncFakedSelector);
  const currentStep = useSelector(walletSyncStepSelector);
  const hasFlowEvent = useMemo(() => !StepsOutsideFlow.includes(currentStep), [currentStep]);
  const { onActionTrack } = useLedgerSyncAnalytics();

  const openDrawer = () => {
    if (!hasBeenFaked) {
      goToWelcomeScreenWalletSync();
    }
    dispatch(setDrawerVisibility(true));
  };

  const closeDrawer = () => {
    if (hasBeenFaked) {
      dispatch(resetWalletSync());
    } else {
      onActionTrack({
        button: "Close",
        step: currentStep,
        flow: hasFlowEvent ? AnalyticsFlow : undefined,
      });
    }
    dispatch(setDrawerVisibility(false));
  };

  return {
    openDrawer,
    closeDrawer,
  };
}
