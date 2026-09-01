import type { ContactsLedgerSyncStatus } from "./types";

export type ContactsFeatureIntroductionRequestInput = Readonly<{
  isContactsEntryAvailable: boolean;
  isDismissed: boolean;
}>;

export type ContactsLedgerSyncIntroductionOpenInput = Readonly<{
  isFeatureIntroductionRequested: boolean;
  ledgerSyncStatus: ContactsLedgerSyncStatus;
  isLedgerSyncIntroductionRequested: boolean;
}>;

export function resolveContactsFeatureIntroductionRequested(
  input: ContactsFeatureIntroductionRequestInput,
): boolean {
  return input.isContactsEntryAvailable && !input.isDismissed;
}

export function isContactsLedgerSyncActivationRequired(status: ContactsLedgerSyncStatus): boolean {
  return status === "inactive" || status === "unavailable";
}

export function resolveContactsLedgerSyncIntroductionOpen(
  input: ContactsLedgerSyncIntroductionOpenInput,
): boolean {
  if (input.isFeatureIntroductionRequested) {
    return false;
  }

  return (
    input.isLedgerSyncIntroductionRequested &&
    isContactsLedgerSyncActivationRequired(input.ledgerSyncStatus)
  );
}
