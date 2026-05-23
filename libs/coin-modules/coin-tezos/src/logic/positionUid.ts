export const STAKING_UID_PREFIX = {
  delegation: "delegation-",
  stake: "stake-",
  unstaking: "unstaking-",
  finalizable: "finalizable-",
} as const;

export const isDelegationPosition = (uid: string) => uid.startsWith(STAKING_UID_PREFIX.delegation);
export const isStakePosition = (uid: string) => uid.startsWith(STAKING_UID_PREFIX.stake);
export const isUnstakingPosition = (uid: string) => uid.startsWith(STAKING_UID_PREFIX.unstaking);
export const isFinalizablePosition = (uid: string) =>
  uid.startsWith(STAKING_UID_PREFIX.finalizable);
