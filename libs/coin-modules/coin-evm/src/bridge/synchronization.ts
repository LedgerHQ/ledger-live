// TODO: Remove this file once Celo bridge is removed
import {
  decodeAccountId,
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account/index";
import {
  AccountShapeInfo,
  GetAccountShape,
  makeSync,
  mergeOps,
  mergeNfts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { nftsFromOperations } from "@ledgerhq/coin-framework/nft/helpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCoinConfig } from "../config";
import { attachOperations, mergeSubAccounts, createSwapHistoryMap, getSyncHash } from "../logic";
import { lastBlock } from "../logic/lastBlock";
import { getExplorerApi } from "../network/explorer";
import { ExplorerApi } from "../network/explorer/types";
import { getNodeApi } from "../network/node/index";

/**
 * Number of blocks that are considered "unsafe" due to a potential reorg.
 * Everything older than this number, should be considered immutable.
 */
export const SAFE_REORG_THRESHOLD = 80;

/**
 * Main synchronization process
 * Get the main Account and the potential TokenAccounts linked to it
 */
export const getAccountShape: GetAccountShape<Account> = async (infos, { blacklistedTokenIds }) => {
  const { initialAccount, address, derivationMode, currency } = infos;
  const nodeApi = getNodeApi(currency);
  const [latestBlock, balance] = await Promise.all([
    lastBlock(currency),
    nodeApi.getCoinBalance(currency, address),
  ]);
  const blockHeight = latestBlock.height;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const findToken = async (contractAddress: string): Promise<TokenCurrency | undefined> =>
    getCryptoAssetsStore().findTokenByAddressInCurrency(contractAddress, currency.id);
  const syncHash = await getSyncHash(currency, blacklistedTokenIds);

  // Due to some changes (as of now: new/updated tokens) we could need to force a sync from 0
  const shouldSyncFromScratch =
    syncHash !== initialAccount?.syncHash || initialAccount === undefined;

  // Get the latest block synchronized to know where to start the new sync
  const latestSyncedHeight = shouldSyncFromScratch ? 0 : initialAccount.blockHeight;

  const { lastCoinOperations, lastTokenOperations, lastNftOperations, lastInternalOperations } =
    await (async (): ReturnType<ExplorerApi["getLastOperations"]> => {
      try {
        const { getLastOperations } = getExplorerApi(currency);
        return await getLastOperations(
          currency,
          address,
          accountId,
          Math.max(latestSyncedHeight - SAFE_REORG_THRESHOLD, 0),
          blockHeight,
        );
      } catch (e) /* istanbul ignore next: just logs */ {
        log("EVM Family", "Failed to get latest transactions", {
          address,
          currency,
          error: e,
        });
        throw e;
      }
    })();
  const swapHistoryMap = createSwapHistoryMap(initialAccount);
  const newSubAccounts = await getSubAccounts(
    infos,
    accountId,
    lastTokenOperations,
    blacklistedTokenIds,
    swapHistoryMap,
    findToken,
  );
  const subAccounts = shouldSyncFromScratch
    ? newSubAccounts
    : mergeSubAccounts(initialAccount, newSubAccounts); // Merging potential new subAccouns while preserving the references
  // Trying to confirm pending operations that we are sure of
  // because they were made in the live
  // Useful for integrations without explorers
  const confirmPendingOperations =
    initialAccount?.pendingOperations?.map(op => getOperationStatus(currency, op)) || [];
  const confirmedOperations = await Promise.all(confirmPendingOperations).then(ops =>
    ops.filter((op): op is Operation => !!op),
  );

  // Coin operations with children ops like token & nft ops attached to it
  const lastCoinOperationsWithAttachements = await attachOperations(
    lastCoinOperations,
    lastTokenOperations,
    lastNftOperations,
    lastInternalOperations,
    { blacklistedTokenIds, findToken },
  );
  const newOperations = [...confirmedOperations, ...lastCoinOperationsWithAttachements];
  const operations =
    shouldSyncFromScratch || !initialAccount?.operations
      ? newOperations
      : mergeOps(initialAccount?.operations, newOperations);
  const operationsWithPendings = mergeOps(operations, initialAccount?.pendingOperations || []);

  // Merging potential new nfts while preserving the references.
  //
  // ⚠️ NFTs are aggregated manually to get the account "balance" for each of them.
  // Because of that, we're not creating NFTs in an incremental way,
  // but always creating them based on *all* operations.
  const nfts = mergeNfts(
    initialAccount?.nfts || [],
    // Adding pendings ops to this to temporarly remove an NFT from an account if actively being transfered
    nftsFromOperations(operationsWithPendings),
  ).filter(nft => nft.amount.gt(0));

  return {
    type: "Account",
    id: accountId,
    syncHash,
    balance,
    spendableBalance: balance,
    blockHeight,
    operations,
    operationsCount: operations.length,
    subAccounts,
    nfts,
    lastSyncDate: new Date(),
  } as Partial<Account>;
};

/**
 * Getting all token related operations in order to provide TokenAccounts
 */
export const getSubAccounts = async (
  infos: AccountShapeInfo<Account>,
  accountId: string,
  lastTokenOperations: Operation[],
  blacklistedTokenIds: string[] = [],
  swapHistoryMap: Map<string, TokenAccount["swapHistory"]>,
  findToken: (contractAddress: string) => Promise<TokenCurrency | undefined>,
): Promise<Partial<TokenAccount>[]> => {
  const { currency } = infos;
  const config = getCoinConfig(currency).info;
  const isLedgerNode = config?.node?.type === "ledger";

  // Creating a Map of Operations by TokenCurrencies in order to know which TokenAccounts should be synced as well
  const erc20OperationsByToken = await lastTokenOperations.reduce(async (accPromise, operation) => {
    const acc = await accPromise;
    const token = operation.contract && (await findToken(operation.contract));
    if (!token || blacklistedTokenIds.includes(token.id)) return acc;

    const tokenAccountId = encodeTokenAccountId(accountId, token);
    const operationId = encodeOperationId(tokenAccountId, operation.hash, operation.type);

    if (!acc.has(token)) {
      acc.set(token, []);
    }
    acc.get(token)?.push({ ...operation, id: operationId, accountId: tokenAccountId });

    return acc;
  }, Promise.resolve(new Map<TokenCurrency, Operation[]>()));

  const tokenEntries = Array.from(erc20OperationsByToken.entries());

  // 🔁 Ledger node → execute all at once
  if (isLedgerNode) {
    return Promise.all(
      tokenEntries.map(([token, ops]) =>
        getSubAccountShape(currency, accountId, token, ops, swapHistoryMap.get(token.id) || []),
      ),
    );
  }

  // 🔁 Non-ledger → chunked execution
  const chunkSize = 9;
  const result: Partial<TokenAccount>[] = [];

  for (let i = 0; i < tokenEntries.length; i += chunkSize) {
    const chunk = tokenEntries.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(([token, ops]) =>
        getSubAccountShape(currency, accountId, token, ops, swapHistoryMap.get(token.id) || []),
      ),
    );
    result.push(...chunkResults);
  }

  return result;
};

/**
 * Fetch the balance for a token and creates a TokenAccount based on this and the provided operations
 */
export const getSubAccountShape = async (
  currency: CryptoCurrency,
  parentId: string,
  token: TokenCurrency,
  operations: Operation[],
  swapHistory: TokenAccount["swapHistory"],
): Promise<Partial<TokenAccount>> => {
  const nodeApi = getNodeApi(currency);
  const { xpubOrAddress: address } = decodeAccountId(parentId);
  const tokenAccountId = encodeTokenAccountId(parentId, token);
  const balance = await nodeApi.getTokenBalance(currency, address, token.contractAddress);

  return {
    type: "TokenAccount",
    id: tokenAccountId,
    parentId,
    token,
    balance,
    spendableBalance: balance,
    creationDate: new Date(),
    operations,
    operationsCount: operations.length,
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory,
  };
};

/**
 * Get a finalized operation depending on it status (confirmed or not)
 */
export const getOperationStatus = async (
  currency: CryptoCurrency,
  op: Operation,
): Promise<Operation | null> => {
  try {
    const nodeApi = getNodeApi(currency);
    const { blockHeight, blockHash, nonce, gasPrice, gasUsed, value } =
      await nodeApi.getTransaction(currency, op.hash);

    if (!blockHeight) {
      throw new Error("getOperationStatus: Transaction has no block");
    }

    const { timestamp } = await nodeApi.getBlockByHeight(currency, blockHeight);
    const date = new Date(timestamp);
    const fee = new BigNumber(gasPrice).multipliedBy(gasUsed);

    return {
      ...op,
      transactionSequenceNumber: new BigNumber(nonce),
      blockHash,
      blockHeight,
      date,
      fee,
      value: new BigNumber(value).plus(fee),
      subOperations: op.subOperations?.map(subOp => ({
        ...subOp,
        transactionSequenceNumber: new BigNumber(nonce),
        blockHash,
        blockHeight,
        date,
      })),
      nftOperations: op.nftOperations?.map(nftOp => ({
        ...nftOp,
        transactionSequenceNumber: new BigNumber(nonce),
        blockHash,
        blockHeight,
        date,
      })),
    } as Operation;
  } catch {
    return null;
  }
};

/**
 * After each sync, it might be necessary to remove pending operations
 * inside of subAccounts.
 */
export const postSync = (initial: Account, synced: Account): Account => {
  // Get the latest nonce from the synced account
  const lastOperation = synced.operations.find(op => ["OUT", "FEES", "NFT_OUT"].includes(op.type));
  const latestNonce = lastOperation?.transactionSequenceNumber || new BigNumber(-1);
  // Set of ids from the already existing subAccount from previous sync
  const initialSubAccountsIds = new Set();
  for (const subAccount of initial.subAccounts || []) {
    initialSubAccountsIds.add(subAccount.id);
  }
  const initialPendingOperations = initial.pendingOperations || [];
  const { operations } = synced;
  const pendingOperations = initialPendingOperations.filter(
    op =>
      !operations.some(o => o.hash === op.hash) &&
      op.transactionSequenceNumber !== undefined &&
      op.transactionSequenceNumber > latestNonce,
  );
  // Set of hashes from the pending operations of the main account
  const coinPendingOperationsHashes = new Set();
  for (const op of pendingOperations) {
    coinPendingOperationsHashes.add(op.hash);
  }

  return {
    ...synced,
    pendingOperations,
    subAccounts:
      synced.subAccounts?.map(subAccount => {
        // If the subAccount is new, just return the freshly synced subAccount
        if (!initialSubAccountsIds.has(subAccount.id)) return subAccount;

        return {
          ...subAccount,
          pendingOperations: subAccount.pendingOperations.filter(
            tokenPendingOperation =>
              // if the pending operation got removed from the main account, remove it as well
              coinPendingOperationsHashes.has(tokenPendingOperation.hash) &&
              // if the transaction has been confirmed, remove it
              !subAccount.operations.some(op => op.hash === tokenPendingOperation.hash) &&
              // if the nonce is still lower than the last one in operations, keep it
              tokenPendingOperation.transactionSequenceNumber !== undefined &&
              tokenPendingOperation.transactionSequenceNumber > latestNonce,
          ),
        };
      }) || [],
  };
};

export const sync = makeSync({
  getAccountShape,
  postSync,
  shouldMergeOps: false,
});
