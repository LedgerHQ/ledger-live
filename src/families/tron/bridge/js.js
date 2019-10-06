// @flow
import { never } from "rxjs";
import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import get from "lodash/get";
import bs58check from "bs58check";
import { log } from "@ledgerhq/logs";
import { CurrencyNotSupported } from "@ledgerhq/errors";
import type {
  Operation,
  TokenCurrency,
  TokenAccount,
  SubAccount
} from "../../../types";
import type { Transaction } from "../types";
import type { CurrencyBridge, AccountBridge } from "../../../types/bridge";
import { findTokenById } from "../../../data/tokens";
import { inferDeprecatedMethods } from "../../../bridge/deprecationUtils";
import network from "../../../network";
import {
  makeStartSync,
  makeScanAccountsOnDevice
} from "../../../bridge/jsHelpers";

const b58 = hex => bs58check.encode(Buffer.from(hex, "hex"));

const txToOps = ({ id, address }, token: ?TokenCurrency) => (
  tx: Object
): Operation[] => {
  const ops = [];
  const hash = tx.txID;
  const date = new Date(tx.block_timestamp);
  get(tx, "raw_data.contract", []).forEach(contract => {
    if (
      token
        ? contract.type === "TransferAssetContract" &&
          "tron/trc10/" + get(contract, "parameter.value.asset_name") ===
            token.id
        : contract.type === "TransferContract"
    ) {
      const { amount, owner_address, to_address } = get(
        contract,
        "parameter.value",
        {}
      );
      if (amount && owner_address && to_address) {
        const value = BigNumber(amount);
        const from = b58(owner_address);
        const to = b58(to_address);
        const sending = address === from;
        const receiving = address === to;
        const fee = BigNumber(0);
        if (sending) {
          ops.push({
            id: `${id}-${hash}-OUT`,
            hash,
            type: "OUT",
            value: value.plus(fee),
            fee,
            blockHeight: 0,
            blockHash: null,
            accountId: id,
            senders: [from],
            recipients: [to],
            date,
            extra: {}
          });
        }
        if (receiving) {
          ops.push({
            id: `${id}-${hash}-IN`,
            hash,
            type: "IN",
            value,
            fee,
            blockHeight: 0,
            blockHash: null,
            accountId: id,
            senders: [from],
            recipients: [to],
            date,
            extra: {}
          });
        }
      }
    }
  });
  return ops;
};

async function fetch(url) {
  const { data } = await network({
    method: "GET",
    url
  });
  log("http", url);
  return data;
}

async function fetchTronAccount(addr: string) {
  const data = await fetch(`https://api.trongrid.io/v1/accounts/${addr}`);
  return data.data;
}

async function fetchTronAccountTxs(
  addr: string,
  shouldFetchMoreTxs: (Operation[]) => boolean
) {
  let payload = await fetch(
    `https://api.trongrid.io/v1/accounts/${addr}/transactions?limit=200`
  );
  let fetchedTxs = payload.data;
  let txs = [];
  while (fetchedTxs && Array.isArray(fetchedTxs) && shouldFetchMoreTxs(txs)) {
    txs = txs.concat(fetchedTxs);
    const next = get(payload, "meta.links.next");
    if (!next) return txs;
    payload = await fetch(next);
    fetchedTxs = payload.data;
  }
  return txs;
}

const getAccountShape = async info => {
  const tronAcc = await fetchTronAccount(info.address);
  if (tronAcc.length === 0) {
    return { balance: BigNumber(0) };
  }
  const acc = tronAcc[0];
  // TODO introduce this concept back in the generic interface
  const availableBalance = BigNumber(acc.balance);
  const balance = availableBalance.plus(
    get(acc, "frozen", []).reduce(
      (sum, o) => sum.plus(o.frozen_balance),
      BigNumber(0)
    )
  );

  const txs = await fetchTronAccountTxs(info.address, txs => txs.length < 1000);

  const operations = flatMap(txs, txToOps(info));

  const subAccounts: SubAccount[] = [];

  get(acc, "assetV2", []).forEach(({ key, value }) => {
    const token = findTokenById(`tron/trc10/${key}`);
    if (!token) return;
    const id = info.id + "+" + key;
    const sub: TokenAccount = {
      type: "TokenAccount",
      id,
      parentId: info.id,
      token,
      balance: BigNumber(value),
      operations: flatMap(txs, txToOps({ ...info, id }, token)),
      pendingOperations: []
    };
    subAccounts.push(sub);
  });

  return {
    balance,
    operations,
    subAccounts
  };
};

const scanAccountsOnDevice = makeScanAccountsOnDevice(getAccountShape);

const startSync = makeStartSync(getAccountShape);

const currencyBridge: CurrencyBridge = {
  scanAccountsOnDevice
};

const createTransaction = () => ({
  family: "tron",
  amount: BigNumber(0),
  recipient: ""
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const getTransactionStatus = a =>
  Promise.reject(
    new CurrencyNotSupported("tron currency not supported", {
      currencyName: a.currency.name
    })
  );

const signAndBroadcast = () => never();

const prepareTransaction = async (a, t: Transaction): Promise<Transaction> =>
  Promise.resolve(t);

const getCapabilities = () => ({
  canSync: true,
  canSend: false
});

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  startSync,
  signAndBroadcast,
  getCapabilities,
  ...inferDeprecatedMethods({
    name: "TronJSBridge",
    createTransaction,
    getTransactionStatus,
    prepareTransaction
  })
};

export default { currencyBridge, accountBridge };
