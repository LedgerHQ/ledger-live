import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { log } from "@ledgerhq/logs";
import {
  makeSync,
  mergeOps,
  type GetAccountShape,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccount, getOperations } from "../network";
import { SuiAccount } from "../types";
import { OperationType, type Operation } from "@ledgerhq/types-live";

/**
 * Get the shape of the account including its operations and balance.
 * @function getAccountShape
 * @param {Object} info - The information needed to retrieve the account shape.
 * @param {string} info.address - The address of the account.
 * @param {SuiAccount} info.initialAccount - The initial account data.
 * @param {Object} info.currency - The currency information.
 * @param {string} info.derivationMode - The derivation mode for the account.
 * @returns {Promise<Object>} A promise that resolves to the account shape including balance and operations.
 */
export const getAccountShape: GetAccountShape<SuiAccount> = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const { blockHeight, balance } = await getAccount(address);

  // Merge new operations with the previously synced ones
  let operations: Operation[] = [];
  try {
    // Needed for incremental synchronisation
    const startAtIn = latestHash(oldOperations, "IN");
    const startAtOut = latestHash(oldOperations, "OUT");
    const newOperations = await getOperations(accountId, address, startAtIn, startAtOut);
    operations = mergeOps(oldOperations, newOperations);
  } catch (e) {
    log(
      "sui/getAccountShape",
      "failed to sync with incremental strategy, falling back to full resync",
      { error: e },
    );
    // if we could NOT sync with existing transaction - we start from the beggining, rewritting transaction history
    operations = await getOperations(accountId, address);
  }

  operations.sort((a, b) => b.date.valueOf() - a.date.valueOf());
  const shape = {
    id: accountId,
    balance,
    spendableBalance: balance,
    operationsCount: operations.length,
    blockHeight,
    suiResources: {},
  };
  return { ...shape, operations };
};

/**
 * Synchronise the account with the latest operations and balance.
 * @function sync
 * @param {Object} params - The parameters for synchronisation.
 * @returns {Promise<void>} A promise that resolves when synchronisation is complete.
 */
export const sync = makeSync({ getAccountShape });

function latestHash(operations: Operation[], type: OperationType) {
  return operations.find(el => type === el.type)?.blockHash ?? null;
}
