import type { Account } from "@ledgerhq/types-live";

export type OnboardingResult = {
  partyId: string;
  completedAccount: Account;
};
