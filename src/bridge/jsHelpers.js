// @flow
import isEqual from "lodash/isEqual";
import { BigNumber } from "bignumber.js";
import { Observable, from } from "rxjs";
import { log } from "@ledgerhq/logs";
import {
  TransportStatusError,
  UserRefusedAddress,
  WrongDeviceForAccount,
} from "@ledgerhq/errors";
import {
  getSeedIdentifierDerivation,
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme,
  isIterableDerivationMode,
  derivationModeSupportsIndex,
  getMandatoryEmptyAccountSkip,
  getDerivationModeStartsAt,
} from "../derivation";
import {
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
  shouldRetainPendingOperation,
  isAccountEmpty,
  shouldShowNewAccount,
  clearAccount,
} from "../account";
import { FreshAddressIndexInvalid } from "../errors";
import type {
  Operation,
  Account,
  ScanAccountEvent,
  SyncConfig,
  CryptoCurrency,
} from "../types";
import type { CurrencyBridge, AccountBridge } from "../types/bridge";
import getAddress from "../hw/getAddress";
import { open, close } from "../hw";
import { withDevice } from "../hw/deviceAccess";

export type GetAccountShape = (
  {
    currency: CryptoCurrency,
    address: string,
    id: string,
    initialAccount?: Account,
  },
  SyncConfig
) => Promise<$Shape<Account>>;

type AccountUpdater = (Account) => Account;

// compare that two dates are roughly the same date in order to update the case it would have drastically changed
const sameDate = (a, b) => Math.abs(a - b) < 1000 * 60 * 30;

// an operation is relatively immutable, however we saw that sometimes it can temporarily change due to reorg,..
export const sameOp = (a: Operation, b: Operation) =>
  a === b ||
  (a.id === b.id && // hash, accountId, type are in id
    (a.fee ? a.fee.isEqualTo(b.fee) : a.fee === b.fee) &&
    (a.value ? a.value.isEqualTo(b.value) : a.value === b.value) &&
    sameDate(a.date, b.date) &&
    a.blockHeight === b.blockHeight &&
    isEqual(a.senders, b.senders) &&
    isEqual(a.recipients, b.recipients));

// efficiently prepend newFetched operations to existing operations
export function mergeOps(
  // existing operations. sorted (newer to older). deduped.
  existing: Operation[],
  // new fetched operations. not sorted. not deduped. time is allowed to overlap inside existing.
  newFetched: Operation[]
): // return a list of operations, deduped and sorted from newer to older
Operation[] {
  // there is new fetched
  if (newFetched.length === 0) return existing;

  // efficient lookup map of id.
  const existingIds = {};
  for (let o of existing) {
    existingIds[o.id] = o;
  }

  // only keep the newFetched that are not in existing. this array will be mutated
  const newOpsIds = {};
  const newOps = newFetched
    .filter((o) => !existingIds[o.id] || !sameOp(existingIds[o.id], o))
    .sort((a, b) => b.date - a.date);
  newOps.forEach((op) => {
    newOpsIds[op.id] = op;
  });

  // return existins when there is no real new operations
  if (newOps.length === 0) return existing;

  // edge case, existing can be empty. return the sorted list.
  if (existing.length === 0) return newOps;

  // building up merging the ops
  const all = [];
  for (let o of existing) {
    // prepend all the new ops that have higher date
    while (newOps.length > 0 && newOps[0].date > o.date) {
      all.push(newOps.shift());
    }
    if (!newOpsIds[o.id]) {
      all.push(o);
    }
  }
  return all;
}

export const makeSync = (
  getAccountShape: GetAccountShape,
  postSync: (initial: Account, synced: Account) => Account = (_, a) => a
): $PropertyType<AccountBridge<any>, "sync"> => (
  initial,
  syncConfig
): Observable<AccountUpdater> =>
  Observable.create((o) => {
    async function main() {
      const accountId = `js:2:${initial.currency.id}:${initial.freshAddress}:${initial.derivationMode}`;
      const needClear = initial.id !== accountId;
      try {
        const shape = await getAccountShape(
          {
            currency: initial.currency,
            id: accountId,
            address: initial.freshAddress,
            initialAccount: needClear ? clearAccount(initial) : initial,
          },
          syncConfig
        );
        o.next((acc) => {
          const a = needClear ? clearAccount(acc) : acc;
          // FIXME reconsider doing mergeOps here. work is redundant for impl like eth
          const operations = mergeOps(a.operations, shape.operations || []);
          return postSync(a, {
            ...a,
            id: accountId,
            spendableBalance: shape.balance || a.balance,
            operationsCount: shape.operationsCount || operations.length,
            lastSyncDate: new Date(),
            creationDate:
              operations.length > 0
                ? operations[operations.length - 1].date
                : new Date(),
            ...shape,
            operations,
            pendingOperations: a.pendingOperations.filter((op) =>
              shouldRetainPendingOperation(a, op)
            ),
          });
        });
        o.complete();
      } catch (e) {
        o.error(e);
      }
    }
    main();
  });

export const makeScanAccounts = (
  getAccountShape: GetAccountShape
): $PropertyType<CurrencyBridge, "scanAccounts"> => ({
  currency,
  deviceId,
  syncConfig,
}): Observable<ScanAccountEvent> =>
  Observable.create((o) => {
    let finished = false;
    const unsubscribe = () => {
      finished = true;
    };

    const derivationsCache = {};

    // in future ideally what we want is:
    // return mergeMap(addressesObservable, address => fetchAccount(address))

    async function stepAccount(
      index,
      { address, path: freshAddressPath },
      derivationMode,
      seedIdentifier
    ): Promise<?Account> {
      if (finished) return;

      const accountId = `js:2:${currency.id}:${address}:${derivationMode}`;
      const accountShape: Account = await getAccountShape(
        {
          currency,
          id: accountId,
          address,
        },
        syncConfig
      );
      if (finished) return;

      const freshAddress = address;
      const operations = accountShape.operations || [];
      const operationsCount = accountShape.operationsCount || operations.length;
      const creationDate =
        operations.length > 0
          ? operations[operations.length - 1].date
          : new Date();
      const balance = accountShape.balance || BigNumber(0);
      const spendableBalance = accountShape.spendableBalance || BigNumber(0);

      if (balance.isNaN()) throw new Error("invalid balance NaN");

      const initialAccount: $Exact<Account> = {
        type: "Account",
        id: accountId,
        seedIdentifier,
        freshAddress,
        freshAddressPath,
        freshAddresses: [
          {
            address: freshAddress,
            derivationPath: freshAddressPath,
          },
        ],
        derivationMode,
        name: "",
        starred: false,
        used: false,
        index,
        currency,
        operationsCount,
        operations: [],
        swapHistory: [],
        pendingOperations: [],
        unit: currency.units[0],
        lastSyncDate: new Date(),
        creationDate,
        // overrides
        balance,
        spendableBalance,
        blockHeight: 0,
      };

      const account = {
        ...initialAccount,
        ...accountShape,
      };

      if (!account.used) {
        account.used = !isAccountEmpty(account);
      }

      return account;
    }

    async function main() {
      // TODO switch to withDevice
      let transport;
      try {
        transport = await open(deviceId);
        const derivationModes = getDerivationModesForCurrency(currency);
        for (const derivationMode of derivationModes) {
          if (finished) break;

          const path = getSeedIdentifierDerivation(currency, derivationMode);
          log(
            "scanAccounts",
            `scanning ${currency.id} on derivationMode=${derivationMode}`
          );

          let result = derivationsCache[path];
          try {
            if (!result) {
              result = await getAddress(transport, {
                currency,
                path,
                derivationMode,
              });
              derivationsCache[path] = result;
            }
          } catch (e) {
            // feature detect any denying case that could happen
            if (
              e instanceof TransportStatusError ||
              e instanceof UserRefusedAddress
            ) {
              log("scanAccounts", "ignore derivationMode=" + derivationMode);
            }
          }
          if (!result) continue;

          const seedIdentifier = result.publicKey;

          let emptyCount = 0;
          const mandatoryEmptyAccountSkip = getMandatoryEmptyAccountSkip(
            derivationMode
          );
          const derivationScheme = getDerivationScheme({
            derivationMode,
            currency,
          });
          const showNewAccount = shouldShowNewAccount(currency, derivationMode);
          const stopAt = isIterableDerivationMode(derivationMode) ? 255 : 1;
          const startsAt = getDerivationModeStartsAt(derivationMode);
          for (let index = startsAt; index < stopAt; index++) {
            if (finished) break;

            if (!derivationModeSupportsIndex(derivationMode, index)) continue;
            const freshAddressPath = runDerivationScheme(
              derivationScheme,
              currency,
              {
                account: index,
              }
            );

            let res = derivationsCache[freshAddressPath];
            if (!res) {
              res = await getAddress(transport, {
                currency,
                path: freshAddressPath,
                derivationMode,
              });
              derivationsCache[freshAddressPath] = res;
            }

            const account = await stepAccount(
              index,
              res,
              derivationMode,
              seedIdentifier
            );

            log(
              "scanAccounts",
              `scanning ${currency.id} at ${freshAddressPath}: ${
                res.address
              } resulted of ${
                account
                  ? `Account with ${account.operations.length} txs`
                  : "no account"
              }`
            );
            if (!account) return;

            account.name = !account.used
              ? getNewAccountPlaceholderName({
                  currency,
                  index,
                  derivationMode,
                })
              : getAccountPlaceholderName({ currency, index, derivationMode });

            if (account.used || showNewAccount) {
              o.next({ type: "discovered", account });
            }

            if (!account.used) {
              if (emptyCount >= mandatoryEmptyAccountSkip) break;
              emptyCount++;
            }
          }
        }
        o.complete();
      } catch (e) {
        o.error(e);
      } finally {
        if (transport) {
          close(transport, deviceId);
        }
      }
    }

    main();

    return unsubscribe;
  });

export function makeAccountBridgeReceive({
  injectGetAddressParams,
}: {
  injectGetAddressParams?: (Account) => *,
} = {}): (
  account: Account,
  {
    verify?: boolean,
    deviceId: string,
    subAccountId?: string,
    freshAddressIndex: ?number,
  }
) => Observable<{
  address: string,
  path: string,
}> {
  return (account, { verify, deviceId, freshAddressIndex }) => {
    let freshAddress;
    if (freshAddressIndex !== undefined && freshAddressIndex !== null) {
      freshAddress = account.freshAddresses[freshAddressIndex];
      if (freshAddress === undefined) {
        throw new FreshAddressIndexInvalid();
      }
    }

    const arg = {
      verify,
      currency: account.currency,
      derivationMode: account.derivationMode,
      path: freshAddress
        ? freshAddress.derivationPath
        : account.freshAddressPath,
      ...(injectGetAddressParams && injectGetAddressParams(account)),
    };
    return withDevice(deviceId)((transport) =>
      from(
        getAddress(transport, arg).then((r) => {
          const accountAddress = freshAddress
            ? freshAddress.address
            : account.freshAddress;
          if (r.address !== accountAddress) {
            throw new WrongDeviceForAccount(
              `WrongDeviceForAccount ${account.name}`,
              {
                accountName: account.name,
              }
            );
          }
          return r;
        })
      )
    );
  };
}
