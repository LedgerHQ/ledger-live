import type { ContactAddress } from "@domain/entity-contact";
import type {
  ContactsAddressValidationPort,
  ContactsAddressValidationResult,
} from "./addressValidation/types";
import type { AddAddressEntryState, AddAddressInputSource } from "../types";

export const EMPTY_ADDRESS_ENTRY_STATE = {
  status: "empty",
  value: "",
  resolvedAddress: null,
  inputMethod: null,
} as const satisfies AddAddressEntryState;

export function createValidatingAddressEntryState(
  value: string,
  inputMethod: AddAddressInputSource,
): AddAddressEntryState {
  return {
    status: "validating",
    value,
    resolvedAddress: null,
    inputMethod,
  };
}

export function resolveAddressEntryState(
  value: string,
  inputMethod: AddAddressInputSource,
  result: ContactsAddressValidationResult,
): AddAddressEntryState {
  switch (result.status) {
    case "valid":
      return {
        status: "valid",
        value,
        resolvedAddress: result.resolvedAddress,
        inputMethod: result.isDomain ? "ens" : inputMethod,
      };
    case "invalid_format":
    case "domain_not_found":
    case "sanctioned":
      return {
        status: "invalid",
        value,
        resolvedAddress: null,
        inputMethod:
          result.status === "domain_not_found" ||
          ((result.status === "invalid_format" || result.status === "sanctioned") &&
            result.isDomain)
            ? "ens"
            : inputMethod,
        error: result.status,
      };
    case "unavailable":
      return {
        status: "unavailable",
        value,
        resolvedAddress: null,
        inputMethod,
      };
  }
}

export function applyAddressEntryIfCurrent(
  currentEntry: AddAddressEntryState,
  nextEntry: AddAddressEntryState,
  expectedValue: string,
): AddAddressEntryState {
  if (currentEntry.value !== expectedValue) {
    return currentEntry;
  }

  return nextEntry;
}

export async function requestAddressValidation(
  addressValidation: ContactsAddressValidationPort,
  currencyId: ContactAddress["currencyId"],
  address: string,
): Promise<ContactsAddressValidationResult> {
  try {
    return await addressValidation.validateAddress({ currencyId, address });
  } catch {
    return { status: "unavailable" };
  }
}
