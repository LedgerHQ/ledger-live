import { useMemo } from "react";
import type { ContactsAddressValidationPort } from "@features/flow-contacts";
import { createContactsAddressValidationService } from "@features/flow-contacts";
import { contactsAddressValidationDependencies } from "../adapters/contactsAddressValidationDependencies";

export function useContactsAddressValidationAdapter(): ContactsAddressValidationPort {
  return useMemo(
    () => createContactsAddressValidationService(contactsAddressValidationDependencies),
    [],
  );
}
