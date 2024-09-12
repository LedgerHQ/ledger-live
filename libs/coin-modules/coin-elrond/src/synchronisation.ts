import { TokenAccount } from "@ledgerhq/types-live";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization/index";
import { getAccount, getAccountDelegations, getEGLDOperations, hasESDTTokens } from "./api";
import elrondBuildESDTTokenAccounts from "./buildSubAccounts";
import { reconciliateSubAccounts } from "./reconciliation";
import { computeDelegationBalance } from "./logic";
import { ElrondAccount } from "./types";

export const getAccountShape: GetAccountShape<ElrondAccount> = async (info, syncConfig) => {
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
  const startAt = oldOperations.length ? Math.floor(oldOperations[0].date.valueOf() / 1000) : 0;

  const account = await getAccount(address);

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
  const newOperations = await getEGLDOperations(accountId, address, startAt, subAccounts);
  const operations = mergeOps(oldOperations, newOperations);

  return {
    id: accountId,
    balance: account.balance.plus(delegationBalance),
    spendableBalance: account.balance,
    operationsCount: operations.length,
    blockHeight: account.blockHeight,
    elrondResources: {
      nonce: account.nonce,
      delegations,
      isGuarded: account.isGuarded,
    },
    subAccounts,
    operations: operations.map(op => {
      const subOperations = inferSubOperations(op.hash, subAccounts);

      return {
        ...op,
        subOperations,
      };
    }),
  };
};

export const sync = makeSync({ getAccountShape });
