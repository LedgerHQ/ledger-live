import { log } from "@ledgerhq/logs";
import { Account, Operation, SubAccount } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import etherscanLikeApi from "./api/etherscan";
import { mergeSubAccounts } from "./logic";
import {
  makeSync,
  makeScanAccounts,
  mergeOps,
  GetAccountShape,
  AccountShapeInfos,
} from "../../bridge/jsHelpers";
import {
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "../../account";
import {
  getAccount,
  getBlock,
  getTokenBalance,
  getTransaction,
} from "./api/rpc";

/**
 * Switch to select one of the compatible explorer
 */
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
 * Main synchronization process
 * Get the main Account and the potential TokenAccounts linked to it
 */
export const getAccountShape: GetAccountShape = async (infos) => {
  const { initialAccount, address, derivationMode, currency } = infos;
  const { blockHeight, balance, nonce } = await getAccount(currency, address);
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // Get the latest stored operation to know where to start the new sync
  const latestCoinOperation =
    initialAccount?.operations?.reduce<Operation | null>((acc, curr) => {
      if (!acc) {
        return curr;
      }
      return (acc?.blockHeight || 0) > (curr?.blockHeight || 0) ? acc : curr;
    }, null);

  // This method could not be working if the integration doesn't have an API to retreive the operations
  const lastCoinOperations = await (async () => {
    try {
      const { getLatestCoinOperations } = await getExplorerApi(currency);
      return await getLatestCoinOperations(
        currency,
        address,
        accountId,
        latestCoinOperation?.blockHeight ? latestCoinOperation.blockHeight : 0
      );
    } catch (e) {
      log("EVM Family", "Failed to get latest transactions", {
        address,
        currency,
        error: e,
      });
      throw e;
    }
  })();

  const newSubAccounts = await getSubAccounts(infos, accountId, nonce);
  // Merging potential new subAccouns while preserving the reference (returned value will be initialAccount.subAccounts)
  const subAccounts = mergeSubAccounts(initialAccount, newSubAccounts);

  // Trying to confirm pending operations that we are sure of
  // because they were made in the live
  // Useful for integrations without explorers
  const confirmPendingOperations =
    initialAccount?.pendingOperations?.map((op) =>
      getOperationStatus(currency, op)
    ) || [];
  const confirmedOperations = await Promise.all(confirmPendingOperations).then(
    (ops) => ops.filter((op): op is Operation => !!op)
  );

  const newOperations = [...confirmedOperations, ...lastCoinOperations];
  const operations = mergeOps(initialAccount?.operations || [], newOperations);
  const lastSyncDate = new Date();

  return {
    type: "Account",
    id: accountId,
    balance,
    spendableBalance: balance,
    operationsCount: nonce,
    blockHeight,
    operations,
    subAccounts,
    lastSyncDate,
  } as Partial<Account>;
};

/**
 * Getting all token related operations in order to provide TokenAccounts
 */
export const getSubAccounts = async (
  infos: AccountShapeInfos,
  accountId: string,
  nonce: number
): Promise<Partial<SubAccount>[]> => {
  const { initialAccount, address, currency } = infos;

  // Get the latest token operation from all subaccounts
  const latestTokenOperation = initialAccount?.subAccounts
    ?.flatMap(({ operations }) => operations)
    .reduce<Operation | null>((acc, curr) => {
      if (!acc) {
        return curr;
      }
      return (acc?.blockHeight || 0) > (curr?.blockHeight || 0) ? acc : curr;
    }, null);

  // This method could not be working if the integration doesn't have an API to retreive the operations
  const lastERC20OperationsAndCurrencies = await (async () => {
    try {
      const { getLatestTokenOperations } = await getExplorerApi(currency);
      return await getLatestTokenOperations(
        currency,
        address,
        accountId,
        latestTokenOperation?.blockHeight ? latestTokenOperation.blockHeight : 0
      );
    } catch (e) {
      log("EVM Family", "Failed to get latest ERC20 transactions", {
        address,
        currency,
        error: e,
      });
      throw e;
    }
  })();

  // Creating a Map of Operations by TokenCurrencies in order to know which TokenAccounts should be synced as well
  const erc20OperationsByToken = lastERC20OperationsAndCurrencies.reduce<
    Map<TokenCurrency, Operation[]>
  >((acc, { tokenCurrency, operation }) => {
    if (!tokenCurrency) return acc;

    if (!acc.has(tokenCurrency)) {
      acc.set(tokenCurrency, []);
    }
    acc.get(tokenCurrency)?.push(operation);

    return acc;
  }, new Map<TokenCurrency, Operation[]>());

  // Fetching all TokenAccounts possible and providing already filtered operations
  const subAccountsPromises: Promise<Partial<SubAccount>>[] = [];
  for (const [token, ops] of erc20OperationsByToken.entries()) {
    subAccountsPromises.push(
      getSubAccountShape(currency, accountId, address, token, ops, nonce)
    );
  }

  return Promise.all(subAccountsPromises);
};

/**
 * Fetch the balance for a token and creates a TokenAccount based on this and the provided operations
 */
export const getSubAccountShape = async (
  currency: CryptoCurrency,
  parentId: string,
  address: string,
  token: TokenCurrency,
  operations: Operation[],
  nonce: number
): Promise<Partial<SubAccount>> => {
  const tokenAccountId = encodeTokenAccountId(parentId, token);
  const balance = await getTokenBalance(
    currency,
    address,
    token.contractAddress
  );

  return {
    type: "TokenAccount",
    id: tokenAccountId,
    parentId,
    token,
    balance,
    spendableBalance: balance,
    creationDate: new Date(),
    operationsCount: nonce,
    operations,
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
  };
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
