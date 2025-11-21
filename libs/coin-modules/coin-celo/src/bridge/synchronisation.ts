import { getAccountRegistrationStatus, getPendingWithdrawals, getVotes } from "../network/sdk";
import { makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account";
import { getEnv } from "@ledgerhq/live-env";
import { CeloAccount } from "../types/types";
import { celoKit } from "../network/sdk";
import { getAccountShape as evmGetAccountShape } from "@ledgerhq/coin-evm/bridge/synchronization";
import { BigNumber } from "bignumber.js";

const kit = celoKit();

export const getAccountShape: GetAccountShape<CeloAccount> = async (info, config) => {
  const { address, currency, initialAccount, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];
  const election = await kit.contracts.getElection();
  const electionConfig = await election.getConfig();
  const lockedGold = await kit.contracts.getLockedGold();
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const accountRegistrationStatus = await getAccountRegistrationStatus(address);
  const pendingWithdrawals = accountRegistrationStatus ? await getPendingWithdrawals(address) : [];
  const votes = accountRegistrationStatus ? await getVotes(address) : [];

  const fromEvm = await evmGetAccountShape(info, config);
  const lockedBalance = await lockedGold.getAccountTotalLockedGold(address);
  const nonvotingLockedBalance = await lockedGold.getAccountNonvotingLockedGold(address);

  const ops = fromEvm.operations || [];

  const newOps = ops.filter((operation, index) => {
    const includesLockedGoldAddress =
      operation.recipients?.includes(lockedGold.address) ||
      operation.senders?.includes(lockedGold.address);
    const isBiggerThanZero = new BigNumber(operation.value.toString()).isGreaterThan(0);
    const includeFailed = operation.hasFailed && operation.type !== "OUT";

    return (
      (!includesLockedGoldAddress && operation.type !== "NONE" && isBiggerThanZero) || includeFailed
    );
  });

  const operations = mergeOps(oldOperations, newOps);

  const shape: Partial<CeloAccount> = {
    id: accountId,
    balance: fromEvm.balance?.plus(lockedBalance) || new BigNumber(0),
    blockHeight: fromEvm.blockHeight || 0,
    operationsCount: operations.length,
    spendableBalance: fromEvm.spendableBalance || new BigNumber(0),
    subAccounts: getEnv("ENABLE_CELO_TOKENS") === false ? [] : fromEvm.subAccounts || [],
    syncHash: fromEvm.syncHash,
    celoResources: {
      registrationStatus: false,
      lockedBalance,
      nonvotingLockedBalance,
      pendingWithdrawals,
      votes,
      electionAddress: election.address,
      lockedGoldAddress: lockedGold.address,
      maxNumGroupsVotedFor: electionConfig.maxNumGroupsVotedFor,
    },
  };
  return { ...shape, operations };
};

export const sync = makeSync({ getAccountShape });
