import React from "react";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "LLM/features/WalletSync/types/Activation";

type LedgerSyncActivationDrawerViewProps = Readonly<{ isOpen: boolean; onClose: () => void }>;

export function LedgerSyncActivationDrawerView({
  isOpen,
  onClose,
}: LedgerSyncActivationDrawerViewProps) {
  return <ActivationDrawer startingStep={Steps.Activation} isOpen={isOpen} handleClose={onClose} />;
}
