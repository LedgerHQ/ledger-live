import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";

import { getAccount, getOperations } from "./api/indexer";
import BigNumber from "bignumber.js";
import { getDelegation } from "./api/node";
import { IconResources } from "./types";

const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const oldOperations = initialAccount?.operations || [];
  // Needed for incremental synchronisation
  const skip = 0;

  // get the current account balance state depending your api implementation
  const { blockHeight, balance } = await getAccount(address, currency);

  // Merge new operations with the previously synced ones
  const newOperations = await getOperations(accountId, address, skip, currency);
  const operations = mergeOps(oldOperations, newOperations);
  const delegationData = await getDelegation(address, currency);

  const iconResources: IconResources = {
    nonce: 0,
    totalDelegated: delegationData.totalDelegated,
    votingPower: delegationData.votingPower,
  };

  return {
    id: accountId,
    balance: new BigNumber(balance),
    spendableBalance: balance.minus(iconResources.totalDelegated).minus(iconResources.votingPower),
    operationsCount: operations.length,
    blockHeight,
    iconResources,
    operations,
  };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });

export const sync = makeSync({ getAccountShape });
