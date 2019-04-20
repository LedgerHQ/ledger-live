// @flow
import Prando from "prando";
import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import { SyncError, NotEnoughBalance } from "@ledgerhq/errors";
import { genAccount, genOperation } from "../mock/account";
import { getOperationAmountNumber } from "../operation";
import { validateNameEdition } from "../account";
import type { Operation } from "../types";
import type { AccountBridge, CurrencyBridge } from "./types";
import { getFeeItems } from "../api/FeesBitcoin";
import { getEstimatedFees } from "../api/Fees";
import { getCryptoCurrencyById } from "../data/cryptocurrencies";

const MOCK_DATA_SEED = process.env.MOCK_DATA_SEED || Math.random();

const defaultOpts = {
  transactionsSizeTarget: 100,
  extraInitialTransactionProps: () => ({
    feePerByte: 10,
    fee: BigNumber(10),
    gasPrice: BigNumber(10),
    gasLimit: BigNumber(10),
    feeCustomUnit: getCryptoCurrencyById("ethereum").units[1],
    tag: undefined,
    networkInfo: null
  }),
  getTotalSpent: (a, t) => Promise.resolve(t.amount),
  checkValidTransaction: () => Promise.resolve(null),
  getMaxAmount: a => Promise.resolve(a.balance)
};

const delay = ms => new Promise(success => setTimeout(success, ms));

type Opts = *;

export function makeMockAccountBridge(opts?: Opts): AccountBridge<*> {
  const { extraInitialTransactionProps, getTotalSpent, getMaxAmount } = {
    ...defaultOpts,
    ...opts
  };

  const checkValidTransaction = async (a, t) => {
    if (t.amount.isGreaterThan(a.balance)) throw new NotEnoughBalance();
    return null;
  };

  const getTransactionExtra = (a, t, field) => t[field];

  const broadcasted: { [_: string]: Operation[] } = {};

  const syncTimeouts = {};

  const startSync = (initialAccount, observation) =>
    Observable.create(o => {
      const accountId = initialAccount.id;

      const sync = () => {
        if (initialAccount.name.includes("crash")) {
          o.error(new SyncError("mock failure"));
          return;
        }
        const ops = broadcasted[accountId] || [];
        broadcasted[accountId] = [];
        o.next(acc => {
          const account = { ...acc };
          account.lastSyncDate = new Date();
          account.blockHeight++;
          for (const op of ops) {
            account.balance = account.balance.plus(
              getOperationAmountNumber(op)
            );
            account.operations = ops.concat(
              account.operations.slice(0).reverse()
            );
            account.pendingOperations = [];
          }
          return account;
        });
        if (observation) {
          syncTimeouts[accountId] = setTimeout(sync, 20000);
        } else {
          o.complete();
        }
      };

      syncTimeouts[accountId] = setTimeout(sync, 2000);

      return () => {
        clearTimeout(syncTimeouts[accountId]);
        syncTimeouts[accountId] = null;
      };
    });

  const checkValidRecipient = (account, recipient) =>
    recipient.length > 3
      ? Promise.resolve(null)
      : Promise.reject(new Error("invalid recipient"));

  const createTransaction = () => ({
    amount: BigNumber(0),
    recipient: "",
    ...extraInitialTransactionProps()
  });

  const fetchTransactionNetworkInfo = async ({ currency }) => {
    if (currency.id === "ripple") return { serverFee: 10 };
    if (currency.id === "ethereum" || currency.id === "ethereum_classic") {
      const serverFees = await getEstimatedFees(currency);
      return { serverFees };
    }
    const feeItems = await getFeeItems(currency);
    return { feeItems };
  };

  const applyTransactionNetworkInfo = (account, transaction, networkInfo) => ({
    ...transaction,
    networkInfo,
    fee: transaction.fee || networkInfo.serverFee
  });

  const getTransactionNetworkInfo = (account, transaction) =>
    transaction.networkInfo;

  const editTransactionAmount = (account, t, amount) => ({
    ...t,
    amount
  });
  const getTransactionAmount = (a, t) => t.amount;

  const editTransactionRecipient = (account, t, recipient) => ({
    ...t,
    recipient
  });

  const getTransactionRecipient = (a, t) => t.recipient;

  const editTransactionExtra = (a, t, field, value) => ({
    ...t,
    [field]: value
  });

  const signAndBroadcast = (account, t, _deviceId) =>
    Observable.create(o => {
      let timeout = setTimeout(() => {
        o.next({ type: "signed" });
        timeout = setTimeout(() => {
          const rng = new Prando();
          const op = genOperation(
            account,
            account,
            account.operations,
            account.currency,
            rng
          );
          op.type = "OUT";
          op.value = t.amount;
          op.blockHash = null;
          op.blockHeight = null;
          op.senders = [account.freshAddress];
          op.recipients = [t.recipient];
          op.blockHeight = account.blockHeight;
          op.date = new Date();
          broadcasted[account.id] = (broadcasted[account.id] || []).concat(op);
          o.next({ type: "broadcasted", operation: { ...op } });
          o.complete();
        }, 3000);
      }, 3000);
      return () => {
        clearTimeout(timeout);
      };
    });

  const addPendingOperation = (account, optimisticOperation) => ({
    ...account,
    pendingOperations: [...account.pendingOperations, optimisticOperation]
  });

  // TODO add optimistic update
  return {
    startSync,
    checkValidRecipient,
    createTransaction,
    fetchTransactionNetworkInfo,
    getTransactionNetworkInfo,
    applyTransactionNetworkInfo,
    editTransactionAmount,
    getTransactionAmount,
    editTransactionRecipient,
    getTransactionRecipient,
    editTransactionExtra,
    getTransactionExtra,
    checkValidTransaction,
    getTotalSpent,
    getMaxAmount,
    signAndBroadcast,
    addPendingOperation
  };
}

export function makeMockCurrencyBridge(opts?: Opts): CurrencyBridge {
  const { transactionsSizeTarget, scanAccountDeviceSuccessRate } = {
    ...defaultOpts,
    ...opts
  };

  const substractOneYear = date =>
    new Date(new Date(date).setFullYear(new Date(date).getFullYear() - 1));

  const scanAccountsOnDevice = currency =>
    Observable.create(o => {
      let unsubscribed = false;
      async function job() {
        if (Math.random() > scanAccountDeviceSuccessRate) {
          await delay(1000);
          if (!unsubscribed) o.error(new SyncError("scan failed"));
          return;
        }
        const nbAccountToGen = 3;
        for (let i = 0; i < nbAccountToGen && !unsubscribed; i++) {
          const isLast = i === 2;
          await delay(500);
          const account = genAccount(`${MOCK_DATA_SEED}_${currency.id}_${i}`, {
            operationsSize: isLast ? 0 : transactionsSizeTarget,
            currency
          });
          account.unit = currency.units[0];
          account.index = i;
          account.operations = isLast
            ? []
            : account.operations.map(operation => ({
                ...operation,
                date: substractOneYear(operation.date)
              }));
          account.name = "";
          account.name = validateNameEdition(account);
          if (isLast) {
            account.balance = BigNumber(0);
          }

          if (!unsubscribed) o.next(account);
        }
        if (!unsubscribed) o.complete();
      }

      job();

      return () => {
        unsubscribed = true;
      };
    });

  return {
    scanAccountsOnDevice
  };
}
