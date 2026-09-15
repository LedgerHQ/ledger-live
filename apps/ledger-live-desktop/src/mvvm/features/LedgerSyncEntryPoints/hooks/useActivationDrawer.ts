import { resetWalletSync, setDrawerVisibility } from "~/renderer/actions/walletSync";
import {
  setWalletSyncEntryFlow,
  type WalletSyncFlow,
} from "../../WalletSync/hooks/useLedgerSyncAnalytics";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { walletSyncFakedSelector } from "~/renderer/reducers/walletSync";
import { useFlows } from "../../WalletSync/hooks/useFlows";

export type OpenActivationDrawerOptions = Readonly<{
  startOnSyncMethod?: boolean;
  analyticsFlow?: WalletSyncFlow;
}>;

export function useActivationDrawer(onboardingNewDevice?: boolean) {
  const dispatch = useDispatch();
  const { goToWelcomeScreenWalletSync, goToSyncMethodScreenWalletSync } = useFlows();
  const hasBeenFaked = useSelector(walletSyncFakedSelector);

  const openDrawer = (options?: OpenActivationDrawerOptions) => {
    setWalletSyncEntryFlow(options?.analyticsFlow);
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
    }
    setWalletSyncEntryFlow(undefined);
    dispatch(setDrawerVisibility(false));
  };

  return {
    openDrawer,
    closeDrawer,
  };
}
