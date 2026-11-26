import React, { useCallback } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { setLedgerSyncActivateDrawer } from "~/actions/walletSync";
import { activateDrawerSelector } from "~/reducers/walletSync";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { useCurrentStep } from "LLM/features/WalletSync/hooks/useCurrentStep";
import { Steps } from "LLM/features/WalletSync/types/Activation";

/** The Ledger Sync activation drawer, opened from the store. */
export function LedgerSyncActivationDrawer() {
  const dispatch = useDispatch();
  const isOpen = useSelector(activateDrawerSelector);
  const { setCurrentStep } = useCurrentStep();

  const onClose = useCallback(() => {
    dispatch(setLedgerSyncActivateDrawer(false));
    setCurrentStep(Steps.Activation);
  }, [dispatch, setCurrentStep]);

  return <ActivationDrawer startingStep={Steps.Activation} isOpen={isOpen} handleClose={onClose} />;
}
