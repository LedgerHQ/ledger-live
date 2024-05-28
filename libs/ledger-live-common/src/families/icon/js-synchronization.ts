import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";

import { getAccount, getOperations } from "./api";
import BigNumber from "bignumber.js";
import { getApiUrl } from "./logic";
import { getDelegation, getPreps } from "./api/sdk";
import { IconResources } from "./types";

const getAccountShape: GetAccountShape = async (info) => {
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
  const startAt = 1;

  const url = getApiUrl(currency);

  // get the current account balance state depending your api implementation
  const { blockHeight, balance, additionalBalance } = await getAccount(
    address,
    url
  );

  // Merge new operations with the previously synced ones
  const newOperations = await getOperations(accountId, address, startAt, url);
  const operations = mergeOps(oldOperations, newOperations);
  // const preps = await getPreps(currency);
  const delegationData = await getDelegation(address, currency);
  const iconResources: IconResources = {
    nonce: 0,
    additionalBalance: new BigNumber(additionalBalance),
    votes: delegationData.delegations,
    totalDelegated: delegationData.totalDelegated,
    votingPower: delegationData.votingPower,
  };
  const shape = {
    id: accountId,
    balance: new BigNumber(balance),
    operationsCount: operations.length,
    blockHeight,
    iconResources,
  };

  return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });

export const sync = makeSync({ getAccountShape });
