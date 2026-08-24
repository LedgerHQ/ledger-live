import { useMemo } from "react";
import { createContactsAddressValidationService } from "@features/flow-contacts-add-address";
import type { ContactsAddressValidationPort } from "@features/platform-contacts";
import { contactsAddressValidationDependencies } from "../adapters/contactsAddressValidationDependencies";

export function useContactsAddressValidationAdapter(): ContactsAddressValidationPort {
  return useMemo(
    () => createContactsAddressValidationService(contactsAddressValidationDependencies),
    [],
  );
}
