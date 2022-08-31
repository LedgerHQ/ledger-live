import { Account, Operation } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccount, getBlock, getTransaction } from "./api/rpc";
import { encodeAccountId } from "../../account";
import etherscanLikeApi from "./api/etherscan";
import {
  makeSync,
  makeScanAccounts,
  mergeOps,
  GetAccountShape,
} from "../../bridge/jsHelpers";

const getExplorerApi = (currency: CryptoCurrency) => {
  const apiType = currency?.ethereumLikeInfo?.explorer?.type;

  switch (apiType) {
    case "etherscan":
    case "blockscout":
      return etherscanLikeApi;

    default:
      throw new Error("API type not supported");
  }
};

/**
 * Synchronization process
 */
export const getAccountShape: GetAccountShape = async (info) => {
  const { initialAccount, address, derivationMode, currency } = info;
  const { blockHeight, balance, nonce } = await getAccount(currency, address);
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // Get the latest stored operation to know where to start the new sync
  const latestOperation = initialAccount?.operations?.reduce((acc, curr) => {
    if (!acc) {
      return curr;
    }
    return (acc?.blockHeight || 0) > (curr?.blockHeight || 0) ? acc : curr;
  }, null as Operation | null);
  // This method could not be working if the integration doesn't have an API to retreive the operations
  const lastOperations = await (async () => {
    try {
      const { getLatestTransactions } = await getExplorerApi(currency);
      return await getLatestTransactions(
        currency,
        address,
        accountId,
        latestOperation?.blockHeight ? latestOperation.blockHeight : 0
      );
    } catch (e) {
      return [];
    }
  })();

  // Trying to confirm pending operations that we are sure of
  // because they were made in the live
  const confirmPendingOperations =
    initialAccount?.pendingOperations?.map((op) =>
      getOperationStatus(currency, op)
    ) || [];
  const confirmedOperations = await Promise.all(confirmPendingOperations).then(
    (ops) => ops.filter((op): op is Operation => !!op)
  );

  const newOperations = [...confirmedOperations, ...lastOperations];
  const operations = mergeOps(initialAccount?.operations || [], newOperations);

  return {
    id: accountId,
    balance,
    spendableBalance: balance,
    operationsCount: nonce,
    blockHeight,
    operations,
  } as Partial<Account>;
};

/**
 * Get a finalized operation depending on it status (confirmed or not)
 */
export const getOperationStatus = async (
  currency: CryptoCurrency,
  op: Operation
): Promise<Operation | null> => {
  try {
    const {
      blockNumber: blockHeight,
      blockHash,
      timestamp,
      nonce,
    } = await getTransaction(currency, op.hash);

    if (!blockHeight) {
      throw new Error("getOperationStatus: Transaction has no block");
    }

    const date = await (async () => {
      // timestamp can be missing depending on the node
      if (timestamp) {
        return new Date(timestamp * 1000);
      }

      // Without timestamp, we directly look for the block
      const { timestamp: blockTimestamp } = await getBlock(
        currency,
        blockHeight
      );
      return new Date(blockTimestamp * 1000);
    })();

    return {
      ...op,
      transactionSequenceNumber: nonce,
      blockHash,
      blockHeight,
      date,
    } as Operation;
  } catch (e) {
    return null;
  }
};

const postSync = (initial: Account, synced: Account) => synced;

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({
  getAccountShape,
  postSync,
  shouldMergeOps: false,
});
