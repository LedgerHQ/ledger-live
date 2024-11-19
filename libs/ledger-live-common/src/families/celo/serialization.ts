import {
  isCeloOperationExtra,
  isCeloOperationExtraRaw,
  type CeloAccount,
  type CeloAccountRaw,
  type CeloOperationExtra,
  type CeloOperationExtraRaw,
  type CeloResources,
  type CeloResourcesRaw,
} from "./types";
import { BigNumber } from "bignumber.js";
import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";

export function toCeloResourcesRaw(r: CeloResources): CeloResourcesRaw {
  const {
    registrationStatus,
    lockedBalance,
    nonvotingLockedBalance,
    pendingWithdrawals,
    votes,
    electionAddress,
    lockedGoldAddress,
    maxNumGroupsVotedFor,
  } = r ?? {};
  return {
    registrationStatus,
    lockedBalance: lockedBalance?.toString(),
    nonvotingLockedBalance: nonvotingLockedBalance?.toString(),
    pendingWithdrawals: pendingWithdrawals?.map(withdrawal => ({
      value: withdrawal.value.toString(),
      time: withdrawal.time.toString(),
      index: withdrawal.index.toString(),
    })),
    votes: votes?.map(vote => ({
      validatorGroup: vote.validatorGroup.toString(),
      amount: vote.amount.toString(),
      activatable: vote.activatable,
      revokable: vote.revokable,
      type: vote.type,
      index: vote.index,
    })),
    electionAddress,
    lockedGoldAddress,
    maxNumGroupsVotedFor: maxNumGroupsVotedFor?.toString(),
  };
}

export function fromCeloResourcesRaw(r: CeloResourcesRaw): CeloResources {
  return {
    registrationStatus: r.registrationStatus,
    lockedBalance: new BigNumber(r.lockedBalance),
    nonvotingLockedBalance: new BigNumber(r.nonvotingLockedBalance),
    pendingWithdrawals: r.pendingWithdrawals?.map(u => ({
      value: new BigNumber(u.value),
      time: new BigNumber(u.time),
      index: Number(u.index),
    })),
    votes: r.votes?.map(vote => ({
      validatorGroup: vote.validatorGroup,
      amount: new BigNumber(vote.amount),
      activatable: vote.activatable,
      revokable: vote.revokable,
      type: vote.type,
      index: vote.index,
    })),
    electionAddress: r.electionAddress,
    lockedGoldAddress: r.lockedGoldAddress,
    maxNumGroupsVotedFor: new BigNumber(r.maxNumGroupsVotedFor),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const celoAccount = account as CeloAccount;
  if (celoAccount.celoResources)
    (accountRaw as CeloAccountRaw).celoResources = toCeloResourcesRaw(celoAccount.celoResources);
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const celoResourcesRaw = (accountRaw as CeloAccountRaw).celoResources;
  if (celoResourcesRaw)
    (account as CeloAccount).celoResources = fromCeloResourcesRaw(celoResourcesRaw);
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  if (!isCeloOperationExtraRaw(extraRaw)) {
    throw new Error("Unsupported OperationExtra");
  }

  const extra: CeloOperationExtra = {
    celoOperationValue: new BigNumber(extraRaw.celoOperationValue),
  };

  if (extraRaw.celoSourceValidator) {
    extra.celoSourceValidator = extraRaw.celoSourceValidator;
  }

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  if (!isCeloOperationExtra(extra)) {
    throw new Error("Unsupported OperationExtra");
  }

  const extraRaw: CeloOperationExtraRaw = {
    celoOperationValue: extra.celoOperationValue.toString(),
  };

  if (extra.celoSourceValidator) {
    extraRaw.celoSourceValidator = extra.celoSourceValidator;
  }

  return extraRaw;
}
