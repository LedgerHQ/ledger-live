// @flow
import type { CeloResources, CeloResourcesRaw } from "./types";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";

export function toCeloResourcesRaw(r: CeloResources): CeloResourcesRaw {
  const {
    registrationStatus,
    lockedBalance,
    nonvotingLockedBalance,
    pendingWithdrawals,
    votes,
    electionAddress,
    lockedGoldAddress,
  } = r;
  return {
    registrationStatus,
    lockedBalance: lockedBalance.toString(),
    nonvotingLockedBalance: nonvotingLockedBalance.toString(),
    pendingWithdrawals: pendingWithdrawals?.map((withdrawal) => ({
      value: withdrawal.value.toString(),
      time: withdrawal.time.toString(),
      index: withdrawal.index.toString(),
    })),
    votes: votes?.map((vote) => ({
      validatorGroup: vote.validatorGroup.toString(),
      amount: vote.amount.toString(),
      activatable: vote.activatable,
      revokable: vote.revokable,
      type: vote.type,
      index: vote.index,
    })),
    electionAddress,
    lockedGoldAddress,
  };
}

export function fromCeloResourcesRaw(r: CeloResourcesRaw): CeloResources {
  // const {
  //   registrationStatus,
  //   lockedBalance,
  //   nonvotingLockedBalance,
  //   votes,
  //   electionAddress,
  //   lockedGoldAddress,
  // } = r;
  log("celo resources raw", JSON.stringify(r));
  return {
    registrationStatus: r.registrationStatus,
    lockedBalance: new BigNumber(r.lockedBalance),
    nonvotingLockedBalance: new BigNumber(r.nonvotingLockedBalance),
    pendingWithdrawals: r.pendingWithdrawals?.map((u) => ({
      value: new BigNumber(u.value),
      time: new BigNumber(u.time),
      index: Number(u.index),
    })),
    votes: r.votes?.map((vote) => ({
      validatorGroup: vote.validatorGroup,
      amount: new BigNumber(vote.amount),
      activatable: vote.activatable,
      revokable: vote.revokable,
      type: vote.type,
      index: vote.index,
    })),
    electionAddress: r.electionAddress,
    lockedGoldAddress: r.lockedGoldAddress,
  };
}
