import React from "react";
import { LedgerSyncActivationDrawerView } from "./LedgerSyncActivationDrawerView";
import { useLedgerSyncActivationDrawerViewModel } from "./useLedgerSyncActivationDrawerViewModel";

/** The Ledger Sync activation drawer of the General section. */
export function LedgerSyncActivationDrawer() {
  const { isAvailable, isOpen, onClose } = useLedgerSyncActivationDrawerViewModel();
  return isAvailable ? <LedgerSyncActivationDrawerView isOpen={isOpen} onClose={onClose} /> : null;
}
