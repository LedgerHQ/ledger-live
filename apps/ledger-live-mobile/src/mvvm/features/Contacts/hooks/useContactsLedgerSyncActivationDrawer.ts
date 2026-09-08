import { useCallback, useRef, useState } from "react";
import { setLedgerSyncReturnsToEntryScreen } from "~/actions/walletSync";
import { useDispatch } from "~/context/hooks";
import type { ContactsLedgerSyncActivationDrawerProps } from "../components/ContactsLedgerSyncActivationDrawer";

export function useContactsLedgerSyncActivationDrawer(): Readonly<{
  ledgerSyncActivationDrawer: ContactsLedgerSyncActivationDrawerProps;
  openLedgerSyncActivationDrawer: () => void;
}> {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const isNavigatingToWalletSync = useRef(false);

  const openLedgerSyncActivationDrawer = useCallback(() => {
    isNavigatingToWalletSync.current = false;
    dispatch(setLedgerSyncReturnsToEntryScreen(true));
    setIsOpen(true);
  }, [dispatch]);

  const onClose = useCallback(() => {
    if (!isNavigatingToWalletSync.current) {
      dispatch(setLedgerSyncReturnsToEntryScreen(false));
    }
    setIsOpen(false);
  }, [dispatch]);
  const onNavigate = useCallback(() => {
    isNavigatingToWalletSync.current = true;
    setIsOpen(false);
  }, []);

  return {
    ledgerSyncActivationDrawer: { isOpen, onClose, onNavigate },
    openLedgerSyncActivationDrawer,
  };
}
