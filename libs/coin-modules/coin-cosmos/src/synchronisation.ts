import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { BigNumber } from "bignumber.js";
import { isAccountEmpty } from "./helpers";
import { txToOps } from "./logic/history/txToOps";
import { CosmosAPI } from "./network/Cosmos";
import { CosmosAccount } from "./types";

export const getAccountShape: GetAccountShape<CosmosAccount> = async (info: any) => {
  const { address, currency, derivationMode, initialAccount, rest } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const {
    accountInfo,
    balances,
    blockHeight,
    txs,
    delegations,
    redelegations,
    unbondings,
    withdrawAddress,
  } = await new CosmosAPI(currency.id).getAccountInfo(address, currency);

  const oldOperations = initialAccount?.operations || [];
  const newOperations = txToOps({ address, unitCode: currency.units[1].code }, accountId, txs);
  const operations = mergeOps(oldOperations, newOperations);
  let balance = balances;
  let delegatedBalance = new BigNumber(0);
  let pendingRewardsBalance = new BigNumber(0);
  let unbondingBalance = new BigNumber(0);

  for (const delegation of delegations) {
    delegatedBalance = delegatedBalance.plus(delegation.amount);
    balance = balance.plus(delegation.amount);

    pendingRewardsBalance = pendingRewardsBalance.plus(delegation.pendingRewards);
  }

  for (const unbonding of unbondings) {
    unbondingBalance = unbondingBalance.plus(unbonding.amount);
    balance = balance.plus(unbonding.amount);
  }

  let spendableBalance = balance.minus(unbondingBalance.plus(delegatedBalance));

  if (spendableBalance.lt(0)) {
    spendableBalance = new BigNumber(0);
  }

  const cosmosResources = {
    delegations,
    redelegations,
    unbondings,
    delegatedBalance,
    pendingRewardsBalance,
    unbondingBalance,
    withdrawAddress,
    sequence: accountInfo.sequence,
    // Captured from the device at scan (hw-getAddress); plain re-syncs have no device,
    // so carry the previously-persisted value forward.
    publicKey: rest?.publicKey ?? initialAccount?.cosmosResources?.publicKey ?? "",
  };

  const shape = {
    id: accountId,
    xpub: address,
    balance: balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    cosmosResources,
    used: !isAccountEmpty({ balance, cosmosResources }),
  };

  if (shape.spendableBalance && shape.spendableBalance.lt(0)) {
    shape.spendableBalance = new BigNumber(0);
  }

  return { ...shape, operations };
};
