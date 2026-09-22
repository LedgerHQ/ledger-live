import { STAKING_UID_PREFIX } from "@ledgerhq/coin-tezos/logic-public";

// Owned by Ledger Live since coin-tezos@12 (ADR-049): coin-tezos exposes only
// STAKING_UID_PREFIX via ./logic-public; the position predicates live here.
export const isDelegationPosition = (uid: string) => uid.startsWith(STAKING_UID_PREFIX.delegation);
export const isStakePosition = (uid: string) => uid.startsWith(STAKING_UID_PREFIX.stake);
export const isUnstakingPosition = (uid: string) => uid.startsWith(STAKING_UID_PREFIX.unstaking);
export const isFinalizablePosition = (uid: string) =>
  uid.startsWith(STAKING_UID_PREFIX.finalizable);
