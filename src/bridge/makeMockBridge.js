// @flow
import Prando from "prando";
import { Observable } from "rxjs";
import {
  genAccount,
  genOperation,
} from "@ledgerhq/live-common/lib/mock/account";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/helpers/operation";
import { BigNumber } from "bignumber.js";
import type { Operation } from "@ledgerhq/live-common/lib/types";
import { validateNameEdition } from "../logic/account";
import type { WalletBridge } from "./types";

const MOCK_DATA_SEED = process.env.MOCK_DATA_SEED || Math.random();

const defaultOpts = {
  transactionsSizeTarget: 100,
  extraInitialTransactionProps: () => null,
  checkValidTransaction: () => Promise.resolve(),
  getTotalSpent: (a, t) => Promise.resolve(t.amount),
  getMaxAmount: a => Promise.resolve(a.balance),
};

const delay = ms => new Promise(success => setTimeout(success, ms));

type Opts = *;

function makeMockBridge(opts?: Opts): WalletBridge<*> {
  const {
    transactionsSizeTarget,
    scanAccountDeviceSuccessRate,
    extraInitialTransactionProps,
    getTotalSpent,
    getMaxAmount,
    checkValidTransaction,
  } = {
    ...defaultOpts,
    ...opts,
  };

  const broadcasted: { [_: string]: Operation[] } = {};

  const syncTimeouts = {};

  const substractOneYear = date =>
    new Date(new Date(date).setFullYear(new Date(date).getFullYear() - 1));

  const startSync = (initialAccount, observation) =>
    Observable.create(o => {
      const accountId = initialAccount.id;

      const sync = () => {
        const ops = broadcasted[accountId] || [];
        console.log("sync", ops);
        broadcasted[accountId] = [];
        o.next(acc => {
          const account = { ...acc };
          account.lastSyncDate = new Date();
          account.blockHeight++;
          for (const op of ops) {
            account.balance = account.balance.plus(
              getOperationAmountNumber(op),
            );
            account.operations = ops.concat(
              account.operations.slice(0).reverse(),
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

  const scanAccountsOnDevice = currency =>
    Observable.create(o => {
      let unsubscribed = false;
      async function job() {
        if (Math.random() > scanAccountDeviceSuccessRate) {
          await delay(1000);
          if (!unsubscribed) o.error(new Error("scan failed"));
          return;
        }
        const nbAccountToGen = 3;
        for (let i = 0; i < nbAccountToGen && !unsubscribed; i++) {
          await delay(500);
          const account = genAccount(`${MOCK_DATA_SEED}_${currency.id}_${i}`, {
            operationsSize: transactionsSizeTarget,
            currency,
          });
          account.unit = currency.units[0];
          account.index = i;
          account.operations = account.operations.map(operation => ({
            ...operation,
            date: substractOneYear(operation.date),
          }));
          account.name = "";
          account.name = validateNameEdition(account);

          if (!unsubscribed) o.next(account);
        }
        if (!unsubscribed) o.complete();
      }

      job();

      return {
        unsubscribe() {
          unsubscribed = true;
        },
      };
    });

  const checkValidRecipient = (currency, recipient) =>
    recipient.length > 0
      ? Promise.resolve(null)
      : Promise.reject(new Error("invalid recipient"));

  const createTransaction = () => ({
    amount: BigNumber(0),
    recipient: "",
    ...extraInitialTransactionProps(),
  });

  const editTransactionAmount = (account, t, amount) => ({
    ...t,
    amount,
  });
  const getTransactionAmount = (a, t) => t.amount;

  const editTransactionRecipient = (account, t, recipient) => ({
    ...t,
    recipient,
  });

  const getTransactionRecipient = (a, t) => t.recipient;

  const signAndBroadcast = (account, t) =>
    Observable.create(o => {
      let timeout = setTimeout(() => {
        o.next({ type: "signed" });
        timeout = setTimeout(() => {
          const rng = new Prando();
          const op = genOperation(
            account,
            account.operations,
            account.currency,
            rng,
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
          console.log(op, broadcasted);
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
    pendingOperations: [...account.pendingOperations, optimisticOperation],
  });

  // TODO add optimistic update
  return {
    startSync,
    scanAccountsOnDevice,
    checkValidRecipient,
    createTransaction,
    editTransactionAmount,
    getTransactionAmount,
    editTransactionRecipient,
    getTransactionRecipient,
    checkValidTransaction,
    getTotalSpent,
    getMaxAmount,
    signAndBroadcast,
    addPendingOperation,
  };
}

export default makeMockBridge;
