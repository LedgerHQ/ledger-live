import React, { useState } from "react";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "LLM/features/WalletSync/types/Activation";

export type ContactsLedgerSyncActivationDrawerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onNavigate: () => void;
}>;

export function ContactsLedgerSyncActivationDrawer({
  isOpen,
  onClose,
  onNavigate,
}: ContactsLedgerSyncActivationDrawerProps): React.JSX.Element | null {
  // Mounted on first open only, then kept mounted so that closing stays animated.
  const [isMounted, setIsMounted] = useState(isOpen);
  if (isOpen && !isMounted) {
    setIsMounted(true);
  }

  if (!isMounted) {
    return null;
  }

  return (
    <ActivationDrawer
      startingStep={Steps.ChooseSyncMethod}
      isOpen={isOpen}
      handleClose={onClose}
      handleNavigate={onNavigate}
    />
  );
}
