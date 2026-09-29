import { useEffect } from "react";
import { selectContacts } from "@domain/entity-contact";
import { toTronAddressBook } from "@features/platform-contacts";
import { tronAddressBookProvider } from "@ledgerhq/live-signer-tron";
import { useStore } from "~/context/hooks";

/**
 * Lets the DMK Tron signer clear-sign registered contacts by giving it a reader
 * for the address book. The signer lives in a legacy package that cannot import
 * the Contacts domain, so the wiring belongs here, at the composition root.
 */
const TronAddressBookSetup = (): null => {
  const store = useStore();

  useEffect(() => {
    tronAddressBookProvider.setSource(() => toTronAddressBook(selectContacts(store.getState())));

    return () => tronAddressBookProvider.clearSource();
  }, [store]);

  return null;
};

export default TronAddressBookSetup;
