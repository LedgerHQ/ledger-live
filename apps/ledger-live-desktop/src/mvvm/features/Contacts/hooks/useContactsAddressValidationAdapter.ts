import { useMemo } from "react";
import {
  createContactsAddressValidationService,
  type ContactsAddressValidationPort,
} from "@features/flow-contacts";
import { contactsAddressValidationDependencies } from "../adapters/contactsAddressValidationDependencies";

export function useContactsAddressValidationAdapter(): ContactsAddressValidationPort {
  return useMemo(
    () => createContactsAddressValidationService(contactsAddressValidationDependencies),
    [],
  );
}
