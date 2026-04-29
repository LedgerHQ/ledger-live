import { useCallback } from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { useCompletePostOnboarding } from "~/logic/postOnboarding/useCompletePostOnboarding";
import { usePostOnboardingHubStepperDisplay } from "~/logic/postOnboarding/usePostOnboardingHubStepperDisplay";
import useLedgerSyncEntryPointViewModel from "LLM/features/LedgerSyncEntryPoint/useLedgerSyncEntryPointViewModel";
import { EntryPoint } from "LLM/features/LedgerSyncEntryPoint/types";
import { usePostOnboardingHubDrawer } from "./usePostOnboardingHubDrawer";
import { useHubDrawerSideEffects } from "./useHubDrawerSideEffects";

export function usePostOnboardingHubDrawerViewModel() {
  const { isPostOnboardingHubDrawerOpen, closePostOnboardingHubDrawer } =
    usePostOnboardingHubDrawer();
  const completePostOnboarding = useCompletePostOnboarding();

  const { actionsState, deviceModelId } = usePostOnboardingHubState();
  const isLedgerSyncActive = Boolean(useSelector(trustchainSelector)?.rootId);
  const accounts = useSelector(accountsSelector);

  const { isActivationDrawerVisible, closeActivationDrawer, openActivationDrawer } =
    useLedgerSyncEntryPointViewModel({
      entryPoint: EntryPoint.postOnboarding,
      page: "PostOnboarding",
    });

  useHubDrawerSideEffects({
    isOpen: isPostOnboardingHubDrawerOpen,
    isActivationDrawerVisible,
  });

  const stepperDisplay = usePostOnboardingHubStepperDisplay(actionsState);
  const areAllPostOnboardingActionsCompleted = stepperDisplay.areAllActionsCompleted;

  const onRequestExit = useCallback(() => {
    closePostOnboardingHubDrawer();
    completePostOnboarding({ skipPortfolioNavigation: true });
  }, [closePostOnboardingHubDrawer, completePostOnboarding]);

  return {
    isPostOnboardingHubDrawerOpen,
    deviceModelId,
    productName: deviceModelId ? getDeviceModel(deviceModelId).productName : "",
    actionsState,
    isLedgerSyncActive,
    accounts,
    openActivationDrawer,
    isActivationDrawerVisible,
    closeActivationDrawer,
    areAllPostOnboardingActionsCompleted,
    stepperDisplay,
    closePostOnboardingHubDrawer,
    onRequestExit,
  };
}
