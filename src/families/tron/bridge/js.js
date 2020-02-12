// @flow
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
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
import network from "../../../network";
import { open } from "../../../hw";
import signTransaction from "../../../hw/signTransaction";
import { makeSync, makeScanAccounts } from "../../../bridge/jsHelpers";

const b58 = hex => bs58check.encode(Buffer.from(hex, "hex"));
const decode58Check = base58 =>
  Buffer.from(bs58check.decode(base58)).toString("hex");
async function doSignAndBroadcast({
  a,
  t,
  deviceId,
  isCancelled,
  onSigned,
  onOperationBroadcasted
}) {
  // Prepare transaction
  const txData = {
    to_address: decode58Check(t.recipient),
    owner_address: decode58Check(a.freshAddress),
    amount: t.amount.toNumber()
  };
  const preparedTransaction = await post(
    "https://api.trongrid.io/wallet/createtransaction",
    txData
  );
  // TODO use withDevice instead
  const transport = await open(deviceId);
  let transaction;
  try {
    // Sign by device
    const signature = await signTransaction(
      a.currency,
      transport,
      a.freshAddressPath,
      preparedTransaction
    );
    transaction = {
      ...preparedTransaction,
      signature: [signature]
    };
  } finally {
    transport.close();
  }

  if (!isCancelled()) {
    onSigned();

    // Broadcast
    const submittedPayment = await broadcastTronTx(transaction);
    if (submittedPayment.result !== true) {
      throw new Error(submittedPayment.resultMessage);
    }

    const hash = transaction.txID;
    const operation = {
      id: `${a.id}-${hash}-OUT`,
      hash,
      accountId: a.id,
      type: "OUT",
      value: t.amount,
      fee: BigNumber(0), // TBD
      blockHash: null,
      blockHeight: null,
      senders: [a.freshAddress],
      recipients: [t.recipient],
      date: new Date(),
      extra: {}
    };
    onOperationBroadcasted(operation);
  }
}

async function post(url, body) {
  const { data } = await network({
    method: "POST",
    url,
    data: body
  });
  log("http", url);
  return data;
}

async function broadcastTronTx(trxTransaction) {
  const result = await post(
    "https://api.trongrid.io/wallet/broadcasttransaction",
    trxTransaction
  );
  return result;
}

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
  const spendableBalance = BigNumber(acc.balance);
  const balance = spendableBalance.plus(
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
    const operations = flatMap(txs, txToOps({ ...info, id }, token));
    const sub: TokenAccount = {
      type: "TokenAccount",
      id,
      starred: false,
      parentId: info.id,
      token,
      balance: BigNumber(value),
      operationsCount: operations.length,
      operations,
      pendingOperations: []
    };
    subAccounts.push(sub);
  });

  return {
    balance,
    spendableBalance,
    operations,
    subAccounts
  };
};

const scanAccounts = makeScanAccounts(getAccountShape);

const sync = makeSync(getAccountShape);

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve(),
  hydrate: () => {},
  scanAccounts
};

const createTransaction = a => {
  throw new CurrencyNotSupported("tron currency not supported", {
    currencyName: a.currency.name
  });
};

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const getTransactionStatus = a =>
  Promise.reject(
    new CurrencyNotSupported("tron currency not supported", {
      currencyName: a.currency.name
    })
  );

const signAndBroadcast = (a, t, deviceId) =>
  Observable.create(o => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    const onSigned = () => {
      o.next({ type: "signed" });
    };
    const onOperationBroadcasted = operation => {
      o.next({ type: "broadcasted", operation });
    };
    doSignAndBroadcast({
      a,
      t,
      deviceId,
      isCancelled,
      onSigned,
      onOperationBroadcasted
    }).then(
      () => {
        o.complete();
      },
      e => {
        o.error(e);
      }
    );
    return () => {
      cancelled = true;
    };
  });

const prepareTransaction = async (a, t: Transaction): Promise<Transaction> =>
  Promise.resolve(t);

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  sync,
  signAndBroadcast,
  signOperation: () => {
    throw new Error("TODO: port to signOperation paradigm");
  },
  broadcast: () => {
    throw new Error("TODO: port to broascast paradigm");
  }
};

export default { currencyBridge, accountBridge };
