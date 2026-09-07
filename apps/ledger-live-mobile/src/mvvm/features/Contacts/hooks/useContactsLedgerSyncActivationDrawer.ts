import { useCallback, useState } from "react";
import { setLedgerSyncReturnsToEntryScreen } from "~/actions/walletSync";
import { useDispatch } from "~/context/hooks";
import type { ContactsLedgerSyncActivationDrawerProps } from "../components/ContactsLedgerSyncActivationDrawer";

export function useContactsLedgerSyncActivationDrawer(): Readonly<{
  ledgerSyncActivationDrawer: ContactsLedgerSyncActivationDrawerProps;
  openLedgerSyncActivationDrawer: () => void;
}> {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const openLedgerSyncActivationDrawer = useCallback(() => {
    dispatch(setLedgerSyncReturnsToEntryScreen(true));
    setIsOpen(true);
  }, [dispatch]);

  const onClose = useCallback(() => setIsOpen(false), []);

  return {
    ledgerSyncActivationDrawer: { isOpen, onClose },
    openLedgerSyncActivationDrawer,
  };
}
