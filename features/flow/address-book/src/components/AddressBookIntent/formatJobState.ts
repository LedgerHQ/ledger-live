import type { AddressBookEvmIntentJobState } from "../../intents/evm/types";

export function getAddressBookIntentTitle(
  jobState: AddressBookEvmIntentJobState | undefined,
): string {
  if (!jobState) {
    return "Starting Address Book intent";
  }

  switch (jobState.type) {
    case "pending":
      return "Preparing Address Book intent";
    case "awaiting-device-confirmation":
      return "Awaiting device confirmation";
    case "partial-result":
      return "Partial Address Book result";
    case "completed":
      return "Address Book intent completed";
    case "failed":
      return "Address Book intent failed";
  }
}

export function formatAddressBookIntentState(
  jobState: AddressBookEvmIntentJobState | undefined,
): string {
  if (!jobState) {
    return "No state emitted yet.";
  }

  return JSON.stringify(jobState, null, 2);
}
