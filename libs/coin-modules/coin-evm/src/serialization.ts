import BigNumber from "bignumber.js";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import { CeloResources, CeloResourcesRaw, EvmResources, EvmResourcesRaw } from "./types";
import { EvmAccount, EvmAccountRaw } from "./types/account";

const fromCeloResourcesRaw = (celoRawResources: CeloResourcesRaw): CeloResources => {
  return {
    ...celoRawResources,
    lockedBalance: new BigNumber(celoRawResources.lockedBalance),
    nonvotingLockedBalance: new BigNumber(celoRawResources.nonvotingLockedBalance),
    pendingWithdrawals: celoRawResources.pendingWithdrawals?.map(pendingWithdrawal => ({
      ...pendingWithdrawal,
      value: new BigNumber(pendingWithdrawal.value),
      time: new BigNumber(pendingWithdrawal.time),
    })),
    votes: celoRawResources.votes?.map(vote => ({
      ...vote,
      amount: new BigNumber(vote.amount),
    })),
    maxNumGroupsVotedFor: new BigNumber(celoRawResources.maxNumGroupsVotedFor),
  };
};
const toCeloResourcesRaw = (celoResources: CeloResources): CeloResourcesRaw => {
  return {
    ...celoResources,
    lockedBalance: celoResources.lockedBalance.toFixed(),
    nonvotingLockedBalance: celoResources.nonvotingLockedBalance.toFixed(),
    pendingWithdrawals: celoResources.pendingWithdrawals?.map(pendingWithdrawal => ({
      ...pendingWithdrawal,
      value: pendingWithdrawal.value.toFixed(),
      time: pendingWithdrawal.time.toFixed(),
    })),
    votes: celoResources.votes?.map(vote => ({
      ...vote,
      amount: vote.amount.toFixed(),
    })),
    maxNumGroupsVotedFor: celoResources.maxNumGroupsVotedFor.toFixed(),
  };
};

const toEvmResourcesRaw = (evmResources: EvmResources): EvmResourcesRaw => {
  if (!evmResources) return;

  switch (evmResources?.type) {
    case "celo_evm":
      return toCeloResourcesRaw(evmResources);
    default:
      return;
  }
};
const fromEvmResourcesRaw = (evmRawResources: EvmResourcesRaw): EvmResources => {
  if (!evmRawResources) return;

  switch (evmRawResources?.type) {
    case "celo_evm":
      return fromCeloResourcesRaw(evmRawResources);
    default:
      return;
  }
};

export const assignToAccountRaw = (account: Account, accountRaw: AccountRaw): void => {
  const evmAccount = account as EvmAccount;
  if (evmAccount.evmResources) {
    (accountRaw as EvmAccountRaw).evmResources = toEvmResourcesRaw(evmAccount.evmResources);
  }
};

export const assignFromAccountRaw = (accountRaw: AccountRaw, account: Account): void => {
  const evmResourcesRaw = (accountRaw as EvmAccountRaw).evmResources;
  if (evmResourcesRaw) (account as EvmAccount).evmResources = fromEvmResourcesRaw(evmResourcesRaw);
};
