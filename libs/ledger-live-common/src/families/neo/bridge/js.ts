import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import { log } from "@ledgerhq/logs";
import { CurrencyNotSupported } from "@ledgerhq/errors";
import type {
  Account,
  AccountBridge,
  CurrencyBridge,
  Operation,
} from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";
import { parseCurrencyUnit, getCryptoCurrencyById } from "../../../currencies";
import network from "../../../network";
import { makeSync, makeScanAccounts } from "../../../bridge/jsHelpers";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";

const receive = makeAccountBridgeReceive();
const neoAsset =
  "c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b";
const neoUnit = getCryptoCurrencyById("neo").units[0];

const txToOps =
  ({ id, address }) =>
  (tx: Record<string, any>): Operation[] => {
    const ops: Operation[] = [];
    if (tx.asset !== neoAsset) return ops;
    const hash = tx.txid;
    const date = new Date(tx.time * 1000);
    const value = parseCurrencyUnit(neoUnit, tx.amount);
    const from = tx.address_from;
    const to = tx.address_to;
    const sending = address === from;
    const receiving = address === to;
    const fee = new BigNumber(0);

    if (sending) {
      ops.push({
        id: `${id}-${hash}-OUT`,
        hash,
        type: "OUT",
        value: value.plus(fee),
        fee,
        blockHeight: tx.block_height,
        blockHash: null,
        accountId: id,
        senders: [from],
        recipients: [to],
        date,
        extra: {},
      });
    }

    if (receiving) {
      ops.push({
        id: `${id}-${hash}-IN`,
        hash,
        type: "IN",
        value,
        fee,
        blockHeight: tx.block_height,
        blockHash: null,
        accountId: id,
        senders: [from],
        recipients: [to],
        date,
        extra: {},
      });
    }

    return ops;
  };

const root = "https://api.neoscan.io";

async function fetch(path) {
  const url = root + path;
  const { data } = await network({
    method: "GET",
    url,
  });
  log("http", url);
  return data;
}

async function fetchBalances(addr: string) {
  const data = await fetch(`/api/main_net/v1/get_balance/${addr}`);
  return data.balance;
}

async function fetchBlockHeight() {
  const data = await fetch("/api/main_net/v1/get_height");
  return data.height;
}

async function fetchTxs(
  addr: string,
  shouldFetchMoreTxs: (arg0: Operation[]) => boolean
) {
  let i = 0;

  const load = () =>
    fetch(`/api/main_net/v1/get_address_abstracts/${addr}/${i + 1}`);

  let payload = await load();
  let txs = [];

  while (payload && i < payload.total_pages && shouldFetchMoreTxs(txs)) {
    txs = txs.concat(payload.entries);
    i++;
    payload = await load();
  }

  return txs;
}

const getAccountShape = async (info) => {
  const blockHeight = await fetchBlockHeight();
  const balances = await fetchBalances(info.address);

  if (balances.length === 0) {
    return {
      balance: new BigNumber(0),
    };
  }

  const balanceMatch = balances.find((b) => b.asset_hash === neoAsset);
  const balance = balanceMatch
    ? parseCurrencyUnit(neoUnit, String(balanceMatch.amount))
    : new BigNumber(0);
  const txs = await fetchTxs(info.address, (txs) => txs.length < 1000);
  const operations = flatMap(txs, txToOps(info));
  return {
    balance,
    operations,
    blockHeight,
  };
};

const scanAccounts = makeScanAccounts({ getAccountShape });
const sync = makeSync({ getAccountShape });
const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

const createTransaction = (a: Account): Transaction => {
  throw new CurrencyNotSupported("neo currency not supported", {
    currencyName: a.currency.name,
  });
};

const updateTransaction = (
  t: Transaction,
  patch: Transaction
): Transaction => ({ ...t, ...patch });

const getTransactionStatus = (a: Account): Promise<TransactionStatus> =>
  Promise.reject(
    new CurrencyNotSupported("neo currency not supported", {
      currencyName: a.currency.name,
    })
  );

const estimateMaxSpendable = (): Promise<BigNumber> =>
  Promise.reject(new Error("estimateMaxSpendable not implemented"));

const prepareTransaction = async (a, t: Transaction): Promise<Transaction> =>
  Promise.resolve(t);

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync,
  receive,
  signOperation: () => {
    throw new Error("signOperation not implemented");
  },
  broadcast: () => {
    throw new Error("broadcast not implemented");
  },
};
export default {
  currencyBridge,
  accountBridge,
};
