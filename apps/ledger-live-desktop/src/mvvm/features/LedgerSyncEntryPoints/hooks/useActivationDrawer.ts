import { resetWalletSync, setDrawerVisibility } from "~/renderer/actions/walletSync";
import {
  AnalyticsFlow,
  StepsOutsideFlow,
  useLedgerSyncAnalytics,
} from "../../WalletSync/hooks/useLedgerSyncAnalytics";
import { useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { walletSyncFakedSelector, walletSyncStepSelector } from "~/renderer/reducers/walletSync";
import { useFlows } from "../../WalletSync/hooks/useFlows";

export type OpenActivationDrawerOptions = Readonly<{
  startOnSyncMethod?: boolean;
}>;

export function useActivationDrawer(onboardingNewDevice?: boolean) {
  const dispatch = useDispatch();
  const { goToWelcomeScreenWalletSync, goToSyncMethodScreenWalletSync } = useFlows();
  const hasBeenFaked = useSelector(walletSyncFakedSelector);
  const currentStep = useSelector(walletSyncStepSelector);
  const hasFlowEvent = useMemo(() => !StepsOutsideFlow.includes(currentStep), [currentStep]);
  const { onActionTrack } = useLedgerSyncAnalytics();

  const openDrawer = (options?: OpenActivationDrawerOptions) => {
    if (!hasBeenFaked) {
      if (options?.startOnSyncMethod) {
        goToSyncMethodScreenWalletSync();
      } else {
        goToWelcomeScreenWalletSync(onboardingNewDevice);
      }
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
