import { makeScanAccounts } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccountRegistrationStatus, getPendingWithdrawals, getVotes } from "./api/sdk";
import { getAddr, makeSync, mergeOps } from "../../bridge/jsHelpers";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { encodeAccountId } from "../../account";
import { getAccountDetails } from "./api";
import { CeloAccount } from "./types";
import { celoKit } from "./api/sdk";

const kit = celoKit();

const getAccountShape: GetAccountShape<CeloAccount> = async info => {
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
  const {
    blockHeight,
    balance,
    spendableBalance,
    operations: newOperations,
    lockedBalance,
    nonvotingLockedBalance,
  } = await getAccountDetails(address, accountId);

  const accountRegistrationStatus = await getAccountRegistrationStatus(address);

  const pendingWithdrawals = accountRegistrationStatus ? await getPendingWithdrawals(address) : [];

  const votes = accountRegistrationStatus ? await getVotes(address) : [];

  const operations = mergeOps(oldOperations, newOperations);
  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    celoResources: {
      registrationStatus: accountRegistrationStatus,
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

export const scanAccounts = makeScanAccounts({ getAccountShape, getAddressFn: getAddr });
export const sync = makeSync({ getAccountShape });
