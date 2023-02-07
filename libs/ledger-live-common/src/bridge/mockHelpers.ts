// TODO makeMockBridge need to be exploded into families (bridge/mock) with utility code shared.
import Prando from "prando";
import { Observable, of } from "rxjs";
import { BigNumber } from "bignumber.js";
import { SyncError } from "@ledgerhq/errors";
import { genOperation } from "@ledgerhq/coin-framework/mocks/account";
import { genAccount } from "../mock/account";
import { getOperationAmountNumber } from "../operation";
import { validateNameEdition } from "../account";
import { delay } from "../promise";
import { getEnv } from "../env";
import perFamilyMock from "../generated/mock";
import {
  Account,
  AccountBridge,
  CurrencyBridge,
  Operation,
} from "@ledgerhq/types-live";
const MOCK_DATA_SEED = getEnv("MOCK") || "MOCK";
const broadcasted: Record<string, Operation[]> = {};
const syncTimeouts = {};
export const sync: AccountBridge<any>["sync"] = (initialAccount) =>
  new Observable((o) => {
    const accountId = initialAccount.id;

    const sync = () => {
      if (initialAccount.name.includes("crash")) {
        o.error(new SyncError("mock failure"));
        return;
      }

      const ops = broadcasted[accountId] || [];
      broadcasted[accountId] = [];
      o.next((acc) => {
        const balance = ops.reduce(
          (sum, op) => sum.plus(getOperationAmountNumber(op)),
          acc.balance
        );
        const nextAcc = {
          ...acc,
          blockHeight: acc.blockHeight + 1000, // make a sync move a lot by blockHeight to avoid flawky tests issue on op confirm.
          lastSyncDate: new Date(),
          operations: ops.concat(acc.operations.slice(0)),
          pendingOperations: [],
          balance,
          spendableBalance: balance,
        };
        const perFamilyOperation = perFamilyMock[acc.currency.id];
        const postSyncAccount =
          perFamilyOperation && perFamilyOperation.postSyncAccount;
        if (postSyncAccount) return postSyncAccount(nextAcc);
        return nextAcc;
      });
      o.complete();
    };

    syncTimeouts[accountId] = setTimeout(sync, 500);

    return () => {
      clearTimeout(syncTimeouts[accountId]);
      syncTimeouts[accountId] = null;
    };
  });
export const broadcast: AccountBridge<any>["broadcast"] = ({
  signedOperation,
}) => Promise.resolve(signedOperation.operation);
export const signOperation: AccountBridge<any>["signOperation"] = ({
  account,
  transaction,
}) =>
  new Observable((o) => {
    let cancelled = false;

    async function main() {
      await delay(1000);
      if (cancelled) return;

      for (let i = 0; i <= 1; i += 0.1) {
        o.next({
          type: "device-streaming",
          progress: i,
          index: i,
          total: 10,
        });
        await delay(300);
      }

      o.next({
        type: "device-signature-requested",
      });
      await delay(2000);
      if (cancelled) return;
      o.next({
        type: "device-signature-granted",
      });
      const rng = new Prando("");
      const op = genOperation(account, account, account.operations, rng);
      op.type = "OUT";
      op.value = transaction.amount;
      op.blockHash = null;
      op.blockHeight = null;
      op.senders = [account.freshAddress];
      op.recipients = [transaction.recipient];
      op.blockHeight = account.blockHeight;
      op.date = new Date();
      await delay(1000);
      if (cancelled) return;
      broadcasted[account.id] = (broadcasted[account.id] || []).concat(op);
      o.next({
        type: "signed",
        signedOperation: {
          operation: { ...op },
          expirationDate: null,
          signature: "",
        },
      });
    }

    main().then(
      () => o.complete(),
      (e) => o.error(e)
    );
    return () => {
      cancelled = true;
    };
  });
export const isInvalidRecipient = (recipient: string) => {
  if (recipient.includes("criticalcrash"))
    throw new Error("isInvalidRecipient_mock_criticalcrash");
  return recipient.includes("invalid") || recipient.length <= 3;
};

const subtractOneYear = (date) =>
  new Date(new Date(date).setFullYear(new Date(date).getFullYear() - 1));

export const scanAccounts: CurrencyBridge["scanAccounts"] = ({ currency }) =>
  new Observable((o) => {
    let unsubscribed = false;

    async function job() {
      // TODO offer a way to mock a failure
      const nbAccountToGen = 3;

      for (let i = 0; i < nbAccountToGen && !unsubscribed; i++) {
        const isLast = i === 2;
        await delay(500);
        const account = genAccount(`${MOCK_DATA_SEED}_${currency.id}_${i}`, {
          operationsSize: isLast ? 0 : 100,
          currency,
        });
        account.unit = currency.units[0];
        account.index = i;
        account.operations = isLast
          ? []
          : account.operations.map((operation) => ({
              ...operation,
              date: subtractOneYear(operation.date),
            }));
        account.used = isLast ? false : account.used;
        account.name = "";
        account.name = validateNameEdition(account);

        if (isLast) {
          account.spendableBalance = account.balance = new BigNumber(0);
        }

        const perFamilyOperation = perFamilyMock[currency.id];
        const postScanAccount =
          perFamilyOperation && perFamilyOperation.postScanAccount;
        if (postScanAccount)
          postScanAccount(account, {
            isEmpty: isLast,
          });
        if (!unsubscribed)
          o.next({
            type: "discovered",
            account,
          });
      }

      if (!unsubscribed) o.complete();
    }

    job();
    return () => {
      unsubscribed = true;
    };
  });
export const makeAccountBridgeReceive: () => (
  account: Account,
  arg1: {
    verify?: boolean;
    deviceId: string;
    subAccountId?: string;
  }
) => Observable<{
  address: string;
  path: string;
}> = () => (account) =>
  of({
    address: account.freshAddress,
    path: account.freshAddressPath,
  });
