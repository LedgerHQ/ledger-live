// TODO makeMockBridge need to be exploded into families (bridge/mock) with utility code shared.
import { generateHistoryFromOperations } from "@ledgerhq/ledger-wallet-framework/account/balanceHistoryCache";
import { genOperation } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { Account, AccountBridge, CurrencyBridge, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import Prando from "prando";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { Observable, of } from "rxjs";
import { loadMockAccountForFamily } from "../coin-modules/registry";
import { genAccount } from "../mock/account";
import { getOperationAmountNumber } from "../operation";
import { delay } from "../promise";
import { type GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
const MOCK_DATA_SEED = "MOCK";
const broadcasted: Record<string, Operation[]> = {};
const syncTimeouts: Record<string, ReturnType<typeof setTimeout> | null> = {};

export const sync: AccountBridge<any>["sync"] = initialAccount =>
  new Observable(o => {
    const accountId = initialAccount.id;

    const sync = async () => {
      const ops = broadcasted[accountId] || [];
      broadcasted[accountId] = [];
      const perFamilyOperation = await loadMockAccountForFamily(initialAccount.currency.family);
      o.next(acc => {
        const balance = ops.reduce(
          (sum, op) => sum.plus(getOperationAmountNumber(op)),
          acc.balance,
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
        const postSyncAccount = perFamilyOperation?.postSyncAccount;
        if (postSyncAccount) return postSyncAccount(nextAcc);
        return nextAcc;
      });
      o.complete();
    };

    syncTimeouts[accountId] = setTimeout(() => sync().catch(e => o.error(e)), 500);

    return () => {
      clearTimeout(syncTimeouts[accountId] ?? undefined);
      syncTimeouts[accountId] = null;
    };
  });

export const broadcast: AccountBridge<any>["broadcast"] = ({ signedOperation }) =>
  Promise.resolve(signedOperation.operation);

export const signOperation: AccountBridge<any>["signOperation"] = ({ account, transaction }) =>
  new Observable(o => {
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
          signature: "",
        },
      });
    }

    main().then(
      () => o.complete(),
      e => o.error(e),
    );
    return () => {
      cancelled = true;
    };
  });

export { isInvalidRecipient } from "./validateAddress";

const subtractOneYear = (date: Date) =>
  new Date(new Date(date).setFullYear(new Date(date).getFullYear() - 1));

const MOCK_SCAN_SIZE = 3;

/** The `index`th account the mock scan finds, the same at every scan; the last one is empty. */
export async function genScannedMockAccount(
  currency: CryptoCurrency,
  index: number,
): Promise<Account> {
  const isLast = index === MOCK_SCAN_SIZE - 1;
  const account = genAccount(`${MOCK_DATA_SEED}_${currency.id}_${index}`, {
    operationsSize: isLast ? 0 : 100,
    currency,
    subAccountsCount: isLast ? 0 : undefined,
    bandwidth: !isLast,
  });
  account.index = index;
  account.operations = isLast
    ? []
    : account.operations.map(operation => ({
        ...operation,
        date: subtractOneYear(operation.date),
      }));
  account.used = isLast ? false : account.used;

  if (isLast) {
    account.spendableBalance = account.balance = new BigNumber(0);
  }

  const perFamilyOperation = await loadMockAccountForFamily(currency.family);
  perFamilyOperation?.postScanAccount?.(account, { isEmpty: isLast });
  account.balanceHistoryCache = generateHistoryFromOperations(account);
  return account;
}

/** The account of the mock scan keyed on `key`, its xpub or address. */
export async function findScannedMockAccount(
  currency: CryptoCurrency,
  key: string,
): Promise<Account | undefined> {
  const accounts = await Promise.all(
    Array.from({ length: MOCK_SCAN_SIZE }, (_, index) => genScannedMockAccount(currency, index)),
  );
  return accounts.find(account => account.xpub === key || account.freshAddress === key);
}

export const scanAccounts: CurrencyBridge["scanAccounts"] = ({ currency }) =>
  new Observable(o => {
    let unsubscribed = false;

    async function job() {
      // TODO offer a way to mock a failure
      for (let i = 0; i < MOCK_SCAN_SIZE && !unsubscribed; i++) {
        await delay(500);
        const account = await genScannedMockAccount(currency, i);
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
  },
) => Observable<GetAddressResult> = () => account =>
  of({
    address: account.freshAddress,
    path: account.freshAddressPath,
    publicKey: "mockPublickKey", // We could probably keep the publicKey in `account.freshPublicKey`
  });

export const signRawOperation: AccountBridge<any>["signRawOperation"] = ({ account }) =>
  new Observable(o => {
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
      op.value = new BigNumber(0);
      op.blockHash = null;
      op.blockHeight = null;
      op.senders = [account.freshAddress];
      op.recipients = [];
      op.blockHeight = account.blockHeight;
      op.date = new Date();
      await delay(1000);
      if (cancelled) return;
      broadcasted[account.id] = (broadcasted[account.id] || []).concat(op);
      o.next({
        type: "signed",
        signedOperation: {
          operation: { ...op },
          signature: "",
        },
      });
    }

    main().then(
      () => o.complete(),
      e => o.error(e),
    );
    return () => {
      cancelled = true;
    };
  });
