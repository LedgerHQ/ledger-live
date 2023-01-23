import { encodeAccountId, inferSubOperations } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import {
  getAccount,
  getAccountDelegations,
  getEGLDOperations,
  hasESDTTokens,
} from "./api";
import elrondBuildESDTTokenAccounts from "./js-buildSubAccounts";
import { Operation, SubAccount, TokenAccount } from "@ledgerhq/types-live";
import { computeDelegationBalance } from "./logic";
import { reconciliateSubAccounts } from "./js-reconciliation";

function pruneOperations(
  operations: Operation[],
  subAccounts: SubAccount[]
): Operation[] {
  const allOperations: Operation[] = [];
  for (const operation of operations) {
    const subOperations = subAccounts
      ? inferSubOperations(operation.hash, subAccounts)
      : undefined;

    if (subOperations?.length !== 0) {
      //prevent doubled transactions in account history
      continue;
    }

    allOperations.push(operation);
  }

  return allOperations;
}

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

  let subAccounts: TokenAccount[] | undefined = [];
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
  let operations = mergeOps(oldOperations, newOperations);
  operations = pruneOperations(operations, subAccounts);

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
    operations,
  };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
