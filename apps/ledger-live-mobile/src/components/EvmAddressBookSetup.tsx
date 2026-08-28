import { useEffect } from "react";
import { selectContacts } from "@domain/entity-contact";
import { toEvmAddressBook } from "@features/platform-contacts";
import { evmAddressBookProvider } from "@ledgerhq/live-signer-evm";
import { useStore } from "~/context/hooks";

/**
 * Lets the DMK Ethereum signer clear-sign registered contacts by giving it a
 * reader for the address book. The signer lives in a legacy package that cannot
 * import the Contacts domain, so the wiring belongs here, at the composition
 * root.
 */
const EvmAddressBookSetup = (): null => {
  const store = useStore();

  useEffect(() => {
    evmAddressBookProvider.setSource(() => toEvmAddressBook(selectContacts(store.getState())));

    return () => evmAddressBookProvider.clearSource();
  }, [store]);

  return null;
};

export default EvmAddressBookSetup;
