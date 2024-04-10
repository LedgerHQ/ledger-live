import {
  decodeAccountId,
  decodeTokenAccountId,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account/index";
import {
  AccountShapeInfo,
  GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { listTokensForCryptoCurrency } from "@ledgerhq/coin-framework/currencies/index";
import { decodeOperationId } from "@ledgerhq/coin-framework/operation";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, SubAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import murmurhash from "imurmurhash";
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
import { TonOperation } from "./types";

const simpleSyncHashMemoize: Record<string, string> = {};
function getSyncHash(currency: CryptoCurrency, blacklistedList: string[]): string {
  const tokens = listTokensForCryptoCurrency(currency).filter(
    token => !blacklistedList.includes(token.id),
  );
  const stringToHash = tokens
    .map(token => token.id + token.contractAddress + token.name + token.ticker + token.units)
    .join("");

  if (!simpleSyncHashMemoize[stringToHash]) {
    simpleSyncHashMemoize[stringToHash] = `0x${murmurhash(stringToHash).result().toString(16)}`;
  }
  return simpleSyncHashMemoize[stringToHash];
}

export const getAccountShape: GetAccountShape = async (info, { blacklistedTokenIds }) => {
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
  const subAccounts = await getSubaccounts(
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
  } as Partial<Account>;
  return toReturn;
};

export const getSubaccountShape = async (
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
  const { balance } = walletsInfo[0];
  const oldOps = info.initialAccount?.subAccounts?.find(a => a.id === tokenAccountId)?.operations;
  const operations = !oldOps || shouldSyncFromScratch ? ops : mergeOps(oldOps, ops);

  return {
    type: "TokenAccount",
    id: tokenAccountId,
    parentId,
    token,
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    operations,
    operationsCount: operations.length,
  };
};

async function getSubaccounts(
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
      getSubaccountShape(info, accountId, token, ops, shouldSyncFromScratch),
    );
  }
  return Promise.all(subAccountsPromises);
}

const postSync = (_initial: Account, synced: Account): Account => {
  const operations = synced.operations || [];
  const initialPendingOps = synced.pendingOperations || [];
  const pendingOperations = initialPendingOps.filter(pOp => !operations.some(o => o.id === pOp.id));
  return { ...synced, pendingOperations };
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
