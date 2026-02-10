import {
  decodeAccountId,
  decodeTokenAccountId,
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
  getSyncHash,
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
import { WalletContractV4 } from "@ton/ton";
import BigNumber from "bignumber.js";
import flatMap from "lodash/flatMap";
import {
  fetchAccountInfo,
  fetchAdjacentTransactions,
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
import { TonAccount, TonOperation, TonSubAccount } from "./types";

const jettonTxMessageHashesMap = new Map<string, string>();

export const getAccountShape: GetAccountShape<TonAccount> = async (
  info,
  { blacklistedTokenIds },
) => {
  let address = info.address;
  const { rest, currency, derivationMode, initialAccount } = info;

  const publicKey = reconciliatePubkey(rest?.publicKey, initialAccount);

  // handle when address is pubkey, can happen when accounts imported using accountID
  if (publicKey === address) {
    address = WalletContractV4.create({
      workchain: 0,
      publicKey: Buffer.from(publicKey, "hex"),
    }).address.toString({ bounceable: false, urlSafe: true });
    // update the account info with the correct address
    info.address = address;
  }

  const blockHeight = await fetchLastBlockNumber();
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  log("debug", `Generation account shape for ${address}`);
  const syncHash = await getSyncHash(currency.id, blacklistedTokenIds);
  const shouldSyncFromScratch = syncHash !== initialAccount?.syncHash;

  const newTxs: TonTransactionsList = { transactions: [], address_book: {} };
  const newJettonTxs: TonJettonTransfer[] = [];
  const oldOps = (initialAccount?.operations ?? []) as TonOperation[];
  const { last_transaction_lt, balance } = await fetchAccountInfo(address);
  // if last_transaction_lt is empty, then there are no transactions in account (as well in token accounts)
  if (last_transaction_lt) {
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

  // Get origin hash_message for each jetton tranfer
  for (const tx of newJettonTxs) {
    const hash = tx.transaction_hash;
    try {
      if (!jettonTxMessageHashesMap.has(hash)) {
        const res = await fetchAdjacentTransactions(hash);
        const hash_message = res.transactions.at(0)?.in_msg?.hash;
        if (hash_message) {
          jettonTxMessageHashesMap.set(hash, hash_message);
        }
      }
    } catch (error) {
      console.error(`Error processing ton jetton hash ${hash}:`, error);
    }
  }

  const newOps = flatMap(newTxs.transactions, mapTxToOps(accountId, address, newTxs.address_book));
  const jettonOpsMapper = mapJettonTxToOps(
    accountId,
    address,
    newTxs.address_book,
    jettonTxMessageHashesMap,
  );
  const newJettonOps = (await Promise.all(newJettonTxs.map(jettonOpsMapper))).flat();
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
  } as Partial<TonAccount>;
  return toReturn;
};

const getSubAccountShape = async (
  info: AccountShapeInfo,
  parentId: string,
  token: TokenCurrency,
  ops: TonOperation[],
  shouldSyncFromScratch: boolean,
): Promise<Partial<TonSubAccount>> => {
  const walletsInfo = await fetchJettonWallets({
    address: info.address,
    jettonMaster: token.contractAddress,
  });

  if (walletsInfo.length !== 1) throw new Error("[ton] unexpected api response");
  const { balance, address: jettonWallet } = walletsInfo[0];
  const tokenAccountId = encodeTokenAccountId(parentId, token);
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
    token,
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    operations,
    operationsCount: operations.length,
    pendingOperations: maybeExistingSubAccount ? maybeExistingSubAccount.pendingOperations : [],
    creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
    balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
    swapHistory: maybeExistingSubAccount ? maybeExistingSubAccount.swapHistory : [],
    jettonWallet, // Address of the jetton wallet contract that holds the token balance and handles transfers
  };
};

async function getSubAccounts(
  info: AccountShapeInfo,
  accountId: string,
  newOps: TonOperation[],
  blacklistedTokenIds: string[] = [],
  shouldSyncFromScratch: boolean,
): Promise<Partial<TonSubAccount>[]> {
  const opsPerToken = new Map<TokenCurrency, TonOperation[]>();
  for (const op of newOps) {
    const { accountId: tokenAccountId } = decodeOperationId(op.id);
    const { token } = await decodeTokenAccountId(tokenAccountId);
    if (!token || blacklistedTokenIds.includes(token.id)) continue;
    if (!opsPerToken.has(token)) opsPerToken.set(token, []);
    opsPerToken.get(token)?.push(op);
  }
  const subAccountsPromises: Promise<Partial<TonSubAccount>>[] = [];
  for (const [token, ops] of opsPerToken.entries()) {
    subAccountsPromises.push(
      getSubAccountShape(info, accountId, token, ops, shouldSyncFromScratch),
    );
  }
  return Promise.all(subAccountsPromises);
}

const postSync = (initial: TonAccount, synced: TonAccount): TonAccount => {
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

function reconciliatePubkey(publicKey?: string, initialAccount?: TonAccount): string {
  if (publicKey?.length === 64) return publicKey;
  if (initialAccount) {
    if (initialAccount.xpub?.length === 64) return initialAccount.xpub;
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    if (xpubOrAddress.length === 64) return xpubOrAddress;
  }
  throw Error("[ton] pubkey was not properly restored");
}

export const sync = makeSync({ getAccountShape, postSync });
