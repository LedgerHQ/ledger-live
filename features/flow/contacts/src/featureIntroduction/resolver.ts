import type { ContactsLedgerSyncStatus } from "../list/types";

export type ContactsFeatureIntroductionRequestInput = Readonly<{
  isContactsEntryAvailable: boolean;
  isDismissed: boolean;
}>;

export type ContactsLedgerSyncIntroductionOpenInput = Readonly<{
  isFeatureIntroductionRequested: boolean;
  ledgerSyncStatus: ContactsLedgerSyncStatus;
  isLedgerSyncIntroductionDismissed: boolean;
}>;

export function resolveContactsFeatureIntroductionRequested(
  input: ContactsFeatureIntroductionRequestInput,
): boolean {
  return input.isContactsEntryAvailable && !input.isDismissed;
}

export function resolveContactsLedgerSyncIntroductionOpen(
  input: ContactsLedgerSyncIntroductionOpenInput,
): boolean {
  if (input.isFeatureIntroductionRequested) {
    return false;
  }

  return input.ledgerSyncStatus === "inactive" && !input.isLedgerSyncIntroductionDismissed;
}
