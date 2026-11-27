import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setLedgerSyncActivateDrawer } from "~/actions/walletSync";
import { activateDrawerSelector } from "~/reducers/walletSync";
import { useCurrentStep } from "LLM/features/WalletSync/hooks/useCurrentStep";
import { Steps } from "LLM/features/WalletSync/types/Activation";

export type LedgerSyncActivationDrawerViewModel = Readonly<{
  isAvailable: boolean;
  isOpen: boolean;
  onClose: () => void;
}>;

/** The activation drawer opens from the store, and only while `llmWalletSync` is on. */
export function useLedgerSyncActivationDrawerViewModel(): LedgerSyncActivationDrawerViewModel {
  const dispatch = useDispatch();
  const isAvailable = useFeature("llmWalletSync")?.enabled ?? false;
  const isOpen = useSelector(activateDrawerSelector);
  const { setCurrentStep } = useCurrentStep();

  const onClose = useCallback(() => {
    dispatch(setLedgerSyncActivateDrawer(false));
    setCurrentStep(Steps.Activation);
  }, [dispatch, setCurrentStep]);

  return { isAvailable, isOpen, onClose };
}
