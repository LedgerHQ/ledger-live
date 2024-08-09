import {
  decodeAccountId,
  decodeTokenAccountId,
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account/index";
import {
  AccountShapeInfo,
  GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { decodeOperationId } from "@ledgerhq/coin-framework/operation";
import { log } from "@ledgerhq/logs";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, SubAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import flatMap from "lodash/flatMap";
import {
  fetchAccountInfo,
  fetchJettonWallets,
  fetchLastBlockNumber,
} from "./bridge/bridgeHelpers/api";
import { TonJettonTransfer, TonTransactionsList } from "./bridge/bridgeHelpers/api.types";
import {
  getJettonTransfers,
  getTransactions,
  mapJettonTxToOps,
  mapTxToOps,
} from "./bridge/bridgeHelpers/txn";
import { getSyncHash } from "./logic";
import { TonOperation } from "./types";

export const getAccountShape: GetAccountShape<Account> = async (info, { blacklistedTokenIds }) => {
  const { address, rest, currency, derivationMode, initialAccount } = info;

  const publicKey = reconciliatePubkey(rest?.publicKey, initialAccount);

  const blockHeight = await fetchLastBlockNumber();
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  log("debug", `Generation account shape for ${address}`);
  const syncHash = getSyncHash(currency, blacklistedTokenIds ?? []);
  const shouldSyncFromScratch = syncHash !== initialAccount?.syncHash;

  const newTxs: TonTransactionsList = { transactions: [], address_book: {} };
  const newJettonTxs: TonJettonTransfer[] = [];
  const oldOps = (initialAccount?.operations ?? []) as TonOperation[];
  const { last_transaction_lt, balance } = await fetchAccountInfo(address);
  // if last_transaction_lt is empty, then there are no transactions in account (as well in token accounts)
  if (last_transaction_lt != null) {
    if (oldOps.length === 0 || shouldSyncFromScratch) {
      const [tmpTxs, tmpJettonTxs] = await Promise.all([
        getTransactions(address),
        getJettonTransfers(address),
      ]);

      newTxs.transactions.push(...tmpTxs.transactions);
      newTxs.address_book = { ...newTxs.address_book, ...tmpTxs.address_book };
      newJettonTxs.push(...tmpJettonTxs);
    } else {
      // if they are the same, we have no new ops (including tokens)
      if (oldOps[0].extra.lt !== last_transaction_lt) {
        const [tmpTxs, tmpJettonTxs] = await Promise.all([
          getTransactions(address, oldOps[0].extra.lt),
          getJettonTransfers(address, oldOps[0].extra.lt),
        ]);
        newTxs.transactions.push(...tmpTxs.transactions);
        newTxs.address_book = { ...newTxs.address_book, ...tmpTxs.address_book };
        newJettonTxs.push(...tmpJettonTxs);
      }
    }
  }

  const newOps = flatMap(newTxs.transactions, mapTxToOps(accountId, address, newTxs.address_book));
  const newJettonOps = flatMap(
    newJettonTxs,
    mapJettonTxToOps(accountId, address, newTxs.address_book),
  );
  const operations = shouldSyncFromScratch ? newOps : mergeOps(oldOps, newOps);
  const subAccounts = await getSubAccounts(
    info,
    accountId,
    newJettonOps,
    blacklistedTokenIds,
    shouldSyncFromScratch,
  );

  const toReturn = {
    id: accountId,
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    operations,
    operationsCount: operations.length,
    subAccounts,
    blockHeight,
    xpub: publicKey,
    lastSyncDate: new Date(),
  } as Partial<Account>;
  return toReturn;
};

const getSubAccountShape = async (
  info: AccountShapeInfo,
  parentId: string,
  token: TokenCurrency,
  ops: TonOperation[],
  shouldSyncFromScratch: boolean,
): Promise<Partial<SubAccount>> => {
  const tokenAccountId = encodeTokenAccountId(parentId, token);
  const walletsInfo = await fetchJettonWallets({
    address: info.address,
    jettonMaster: token.contractAddress,
  });
  if (walletsInfo.length !== 1) throw new Error("[ton] unexpected api response");
  const { balance, address: jettonWalletAddress } = walletsInfo[0];
  const oldOps = info.initialAccount?.subAccounts?.find(a => a.id === tokenAccountId)?.operations;
  const operations = !oldOps || shouldSyncFromScratch ? ops : mergeOps(oldOps, ops);
  const maybeExistingSubAccount =
    info.initialAccount &&
    info.initialAccount.subAccounts &&
    info.initialAccount.subAccounts.find(a => a.id === tokenAccountId);

  return {
    type: "TokenAccount",
    id: tokenAccountId,
    parentId,
    token: { ...token, contractAddress: jettonWalletAddress }, // the contract address is replaced for the jetton wallet address, it will be use for the token transfer
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    operations,
    operationsCount: operations.length,
    pendingOperations: maybeExistingSubAccount ? maybeExistingSubAccount.pendingOperations : [],
    creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
    balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
    swapHistory: [],
  };
};

async function getSubAccounts(
  info: AccountShapeInfo,
  accountId: string,
  newOps: TonOperation[],
  blacklistedTokenIds: string[] = [],
  shouldSyncFromScratch: boolean,
): Promise<Partial<SubAccount>[]> {
  const opsPerToken = newOps.reduce((acc, op) => {
    const { accountId: tokenAccountId } = decodeOperationId(op.id);
    const { token } = decodeTokenAccountId(tokenAccountId);
    if (!token || blacklistedTokenIds.includes(token.id)) return acc;
    if (!acc.has(token)) acc.set(token, []);
    acc.get(token)?.push(op);
    return acc;
  }, new Map<TokenCurrency, TonOperation[]>());
  const subAccountsPromises: Promise<Partial<SubAccount>>[] = [];
  for (const [token, ops] of opsPerToken.entries()) {
    subAccountsPromises.push(
      getSubAccountShape(info, accountId, token, ops, shouldSyncFromScratch),
    );
  }
  return Promise.all(subAccountsPromises);
}

const postSync = (initial: Account, synced: Account): Account => {
  // Set of ids from the already existing subAccount from previous sync
  const initialSubAccountsIds = new Set();
  for (const subAccount of initial.subAccounts || []) {
    initialSubAccountsIds.add(subAccount.id);
  }

  const initialPendingOperations = initial.pendingOperations || [];
  const { operations } = synced;
  const pendingOperations = initialPendingOperations.filter(
    op => !operations.some(o => o.id === op.id),
  );
  // Set of hashes from the pending operations of the main account
  const coinPendingOperationsHashes = new Set();
  for (const op of pendingOperations) {
    coinPendingOperationsHashes.add(op.hash);
  }

  return {
    ...synced,
    pendingOperations,
    subAccounts: synced.subAccounts?.map(subAccount => {
      // If the subAccount is new, just return the freshly synced subAccount
      if (!initialSubAccountsIds.has(subAccount.id)) return subAccount;
      return {
        ...subAccount,
        pendingOperations: subAccount.pendingOperations.filter(
          tokenPendingOperation =>
            // if the pending operation got removed from the main account, remove it as well
            coinPendingOperationsHashes.has(tokenPendingOperation.hash) &&
            // if the transaction has been confirmed, remove it
            !subAccount.operations.some(op => op.id === tokenPendingOperation.id),
        ),
      };
    }),
  };
};

function reconciliatePubkey(publicKey?: string, initialAccount?: Account): string {
  if (publicKey?.length === 64) return publicKey;
  if (initialAccount) {
    if (initialAccount.xpub?.length === 64) return initialAccount.xpub;
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    if (xpubOrAddress.length === 64) return xpubOrAddress;
  }
  throw Error("[ton] pubkey was not properly restored");
}

export const sync = makeSync({ getAccountShape, postSync });
