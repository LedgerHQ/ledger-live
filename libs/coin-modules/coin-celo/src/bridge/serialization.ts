import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import { fromRawBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import {
  isCeloOperationExtra,
  isCeloOperationExtraRaw,
  type CeloAccount,
  type CeloAccountRaw,
  type CeloOperationExtra,
  type CeloOperationExtraRaw,
  type CeloResources,
  type CeloResourcesRaw,
} from "../types";

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
    lockedBalance: fromRawBigNumber(r.lockedBalance),
    nonvotingLockedBalance: fromRawBigNumber(r.nonvotingLockedBalance),
    pendingWithdrawals: r.pendingWithdrawals?.map(u => ({
      value: fromRawBigNumber(u.value),
      time: fromRawBigNumber(u.time),
      index: Number(u.index),
    })),
    votes: r.votes?.map(vote => ({
      validatorGroup: vote.validatorGroup,
      amount: fromRawBigNumber(vote.amount),
      activatable: vote.activatable,
      revokable: vote.revokable,
      type: vote.type,
      index: vote.index,
    })),
    electionAddress: r.electionAddress,
    lockedGoldAddress: r.lockedGoldAddress,
    maxNumGroupsVotedFor: fromRawBigNumber(r.maxNumGroupsVotedFor),
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
  const extra: CeloOperationExtra = {};

  if (!isCeloOperationExtraRaw(extraRaw)) {
    return extra;
  }

  if (extraRaw.celoOperationValue) {
    extra.celoOperationValue = fromRawBigNumber(extraRaw.celoOperationValue);
  }

  if (extraRaw.celoSourceValidator) {
    extra.celoSourceValidator = extraRaw.celoSourceValidator;
  }

  if (extraRaw.feeCurrencyAddress) {
    extra.feeCurrencyAddress = extraRaw.feeCurrencyAddress;
  }

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  const extraRaw: CeloOperationExtraRaw = {};

  if (!isCeloOperationExtra(extra)) {
    return extraRaw;
  }

  if (extra.celoOperationValue) {
    extraRaw.celoOperationValue = extra.celoOperationValue.toString();
  }

  if (extra.celoSourceValidator) {
    extraRaw.celoSourceValidator = extra.celoSourceValidator;
  }

  if (extra.feeCurrencyAddress) {
    extraRaw.feeCurrencyAddress = extra.feeCurrencyAddress;
  }

  return extraRaw;
}
