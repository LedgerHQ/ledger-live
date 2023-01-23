import { TokenAccount } from "@ledgerhq/types-live";
import { encodeAccountId, inferSubOperations } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeScanAccounts, makeSync, mergeOps } from "../../bridge/jsHelpers";
import {
  getAccount,
  getAccountDelegations,
  getEGLDOperations,
  hasESDTTokens,
} from "./api";
import elrondBuildESDTTokenAccounts from "./js-buildSubAccounts";
import { reconciliateSubAccounts } from "./js-reconciliation";
import { computeDelegationBalance } from "./logic";

const getAccountShape: GetAccountShape = async (info, syncConfig) => {
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
  const startAt = oldOperations.length
    ? Math.floor(oldOperations[0].date.valueOf() / 1000)
    : 0;

  const { blockHeight, balance, nonce } = await getAccount(address);

  const delegations = await getAccountDelegations(address);

  let subAccounts: TokenAccount[] = [];
  const hasTokens = await hasESDTTokens(address);
  if (hasTokens) {
    const tokenAccounts = await elrondBuildESDTTokenAccounts({
      currency,
      accountId: accountId,
      accountAddress: address,
      existingAccount: initialAccount,
      syncConfig,
    });

    if (tokenAccounts) {
      subAccounts = reconciliateSubAccounts(tokenAccounts, initialAccount);
    }
  }

  const delegationBalance = computeDelegationBalance(delegations);

  // Merge new operations with the previously synced ones
  const newOperations = await getEGLDOperations(
    accountId,
    address,
    startAt,
    subAccounts
  );
  const operations = mergeOps(oldOperations, newOperations);

  return {
    id: accountId,
    balance: balance.plus(delegationBalance),
    spendableBalance: balance,
    operationsCount: operations.length,
    blockHeight,
    elrondResources: {
      nonce,
      delegations,
    },
    subAccounts,
    operations: operations.map((op) => {
      const subOperations = inferSubOperations(op.hash, subAccounts);

      return {
        ...op,
        subOperations,
      };
    }),
  };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
