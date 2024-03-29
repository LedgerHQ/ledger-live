export type PolkadotOperationMode =
  | "send"
  | "bond"
  | "unbond"
  | "rebond"
  | "withdrawUnbonded"
  | "setController"
  | "nominate"
  | "chill"
  | "claimReward";

export type PalletMethod =
  | "transfer"
  | "transferAllowDeath"
  | "transferKeepAlive"
  | "bond"
  | "bondExtra"
  | "rebond"
  | "unbond"
  | "nominate"
  | "chill"
  | "withdrawUnbonded"
  | "setController"
  | "payoutStakers";
