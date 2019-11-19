// @flow
// TODO makeMockBridge need to be exploded into families (bridge/mock) with utility code shared.

import Prando from "prando";
import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import { SyncError } from "@ledgerhq/errors";
import { genAccount, genOperation } from "../mock/account";
import { getOperationAmountNumber } from "../operation";
import { validateNameEdition } from "../account";
import type {
  Operation,
  Account,
  CryptoCurrency,
  Transaction,
  SignAndBroadcastEvent,
  ScanAccountEvent
} from "../types";

const MOCK_DATA_SEED = process.env.MOCK_DATA_SEED || Math.random();

const delay = ms => new Promise(success => setTimeout(success, ms));

const broadcasted: { [_: string]: Operation[] } = {};

const syncTimeouts = {};

type SyncRes = Account => Account;

export const startSync = (
  initialAccount: Account,
  observation: boolean
): Observable<SyncRes> =>
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
        const balance = ops.reduce(
          (sum, op) => sum.plus(getOperationAmountNumber(op)),
          acc.balance
        );
        return {
          ...acc,
          blockHeight: acc.blockHeight + 1,
          lastSyncDate: new Date(),
          operations: ops.concat(acc.operations.slice(0)),
          pendingOperations: [],
          balance,
          spendableBalance: balance
        };
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

export const signAndBroadcast = (
  account: Account,
  t: Transaction,
  _deviceId: string
): Observable<SignAndBroadcastEvent> =>
  Observable.create(o => {
    let timeout = setTimeout(() => {
      o.next({ type: "signed" });
      timeout = setTimeout(() => {
        const rng = new Prando();
        const op = genOperation(account, account, account.operations, rng);
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

export const isInvalidRecipient = (recipient: string) =>
  recipient.includes("invalid") || recipient.length <= 3;

const subtractOneYear = date =>
  new Date(new Date(date).setFullYear(new Date(date).getFullYear() - 1));

export const scanAccountsOnDevice = (
  currency: CryptoCurrency
): Observable<ScanAccountEvent> =>
  Observable.create(o => {
    let unsubscribed = false;
    async function job() {
      // TODO offer a way to mock a failure
      const nbAccountToGen = 3;
      for (let i = 0; i < nbAccountToGen && !unsubscribed; i++) {
        const isLast = i === 2;
        await delay(500);
        const account = genAccount(`${MOCK_DATA_SEED}_${currency.id}_${i}`, {
          operationsSize: isLast ? 0 : 100,
          currency
        });
        account.unit = currency.units[0];
        account.index = i;
        account.operations = isLast
          ? []
          : account.operations.map(operation => ({
              ...operation,
              date: subtractOneYear(operation.date)
            }));
        account.name = "";
        account.name = validateNameEdition(account);
        if (isLast) {
          account.balance = BigNumber(0);
        }

        if (!unsubscribed) o.next({ type: "discovered", account });
      }
      if (!unsubscribed) o.complete();
    }

    job();

    return () => {
      unsubscribed = true;
    };
  });
