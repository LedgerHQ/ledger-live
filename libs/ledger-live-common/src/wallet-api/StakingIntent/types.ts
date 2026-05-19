export type StakingIntentName = "delegate" | "redelegate" | "unbond" | "claimRewards";

export type StakingIntentOpenParams = {
  accountId: string;
  intent: StakingIntentName;
  validatorAddress?: string;
  validatorDstAddress?: string;
};

export type StakingIntentOpenResult = void;

export type StakingIntentListParams = {
  accountId: string;
};

export type StakingIntentDescriptor = {
  name: StakingIntentName;
  enabled: boolean;
  params?: string[];
};

export type StakingIntentListResult = {
  intents: StakingIntentDescriptor[];
};

export const VALID_INTENTS: StakingIntentName[] = [
  "delegate",
  "redelegate",
  "unbond",
  "claimRewards",
];
