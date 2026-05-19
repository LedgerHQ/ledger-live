import type { Account } from "@ledgerhq/types-live";

export type StakingIntent = "stake" | "unstake" | "restake" | "claimRewards" | "withdraw";

export type StakingIntentOpenParams = {
  accountId: string;
  intent: StakingIntent;
  validatorAddress?: string;
  validatorDstAddress?: string;
};

export type StakingIntentOpenResult = void;

export type StakingIntentListParams = {
  accountId: string;
};

export type StakingIntentDescriptor = {
  intent: StakingIntent;
  label: string;
  enabled: boolean;
  params?: string[];
};

export type StakingIntentListResult = {
  intents: StakingIntentDescriptor[];
};

export type FamilyIntentConfig = {
  intent: StakingIntent;
  label: string;
  params?: string[];
  isEnabled: (account: Account) => boolean;
};

export type FamilyIntentRegistry = {
  family: string;
  intents: FamilyIntentConfig[];
};

export const VALID_INTENTS: StakingIntent[] = [
  "stake",
  "unstake",
  "restake",
  "claimRewards",
  "withdraw",
];

/** @deprecated Use StakingIntent */
export type StakingIntentName = StakingIntent;
