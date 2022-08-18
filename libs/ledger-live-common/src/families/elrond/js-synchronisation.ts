import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import {
  getAccount,
  getAccountDelegations,
  getOperations,
  hasESDTTokens,
} from "./api";
import elrondBuildESDTTokenAccounts from "./js-buildSubAccounts";
import { reconciliateSubAccounts } from "./js-reconciliation";
import { FEES_BALANCE } from "./constants";
import { TokenAccount } from "@ledgerhq/types-live";
import { computeDelegationBalance } from "./logic";
import { getProviders } from "./api/sdk";

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
  const startAt = 0;

  // get the current account balance state depending your api implementation
  const { blockHeight, balance, nonce } = await getAccount(address);
  // Merge new operations with the previously synced ones
  const newOperations = await getOperations(accountId, address, startAt);
  const operations = mergeOps(oldOperations, newOperations);

  let subAccounts: TokenAccount[] | undefined = [];
  const hasTokens = await hasESDTTokens(address);
  if (hasTokens) {
    const tokenAccounts = await elrondBuildESDTTokenAccounts({
      currency,
      accountId: accountId,
      accountAddress: address,
      existingAccount: initialAccount,
      syncConfig: {
        paginationConfig: {},
      },
    });

    if (tokenAccounts) {
      subAccounts = reconciliateSubAccounts(tokenAccounts, initialAccount);
    }
  }

  const delegations = await getAccountDelegations(address);

  const providers = await getProviders();

  const delegationBalance = computeDelegationBalance(delegations);

  const shape = {
    id: accountId,
    balance: balance.plus(delegationBalance),
    spendableBalance: balance.gt(FEES_BALANCE)
      ? balance.minus(FEES_BALANCE)
      : balance,
    operationsCount: operations.length,
    blockHeight,
    elrondResources: {
      nonce,
      delegations,
      providers,
    },
    subAccounts,
  };

  return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
