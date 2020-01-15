// @flow

import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import {
  getSeedIdentifierDerivation,
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme,
  isIterableDerivationMode,
  derivationModeSupportsIndex,
  getMandatoryEmptyAccountSkip,
  getDerivationModeStartsAt
} from "../derivation";
import {
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
  shouldRetainPendingOperation
} from "../account";
import uniqBy from "lodash/uniqBy";
import type {
  Operation,
  Account,
  ScanAccountEvent,
  SyncConfig
} from "../types";
import type { CurrencyBridge, AccountBridge } from "../types/bridge";
import getAddress from "../hw/getAddress";
import { open } from "../hw";

type GetAccountShape = (
  { address: string, id: string },
  SyncConfig
) => Promise<$Shape<Account>>;

type AccountUpdater = Account => Account;

export function mergeOps(
  existing: Operation[],
  newFetched: Operation[]
): Operation[] {
  const ids = existing.map(o => o.id);
  const all = newFetched.filter(o => !ids.includes(o.id)).concat(existing);
  return uniqBy(
    all.sort((a, b) => b.date - a.date),
    "id"
  );
}

export const makeSync = (
  getAccountShape: GetAccountShape
): $PropertyType<AccountBridge<any>, "sync"> => (
  initial,
  syncConfig
): Observable<AccountUpdater> =>
  Observable.create(o => {
    async function main() {
      try {
        const shape = await getAccountShape(
          {
            id: initial.id,
            address: initial.freshAddress
          },
          syncConfig
        );
        o.next(a => {
          const operations = mergeOps(a.operations, shape.operations || []);
          return {
            ...a,
            spendableBalance: shape.balance || a.balance,
            operationsCount: shape.operationsCount || operations.length,
            ...shape,
            operations,
            pendingOperations: a.pendingOperations.filter(op =>
              shouldRetainPendingOperation(a, op)
            )
          };
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
  syncConfig
}): Observable<ScanAccountEvent> =>
  Observable.create(o => {
    let finished = false;
    const unsubscribe = () => {
      finished = true;
    };

    // in future ideally what we want is:
    // return mergeMap(addressesObservable, address => fetchAccount(address))

    let newAccountCount = 0;

    async function stepAddress(
      index,
      { address, path: freshAddressPath },
      derivationMode,
      shouldSkipEmpty,
      seedIdentifier
    ): { account?: Account, complete?: boolean } {
      const accountId = `js:2:${currency.id}:${address}:${derivationMode}`;
      const accountShape: Account = await getAccountShape(
        {
          id: accountId,
          address
        },
        syncConfig
      );
      if (finished) return { complete: true };

      const freshAddress = address;
      const operations = accountShape.operations || [];
      const balance = accountShape.balance || BigNumber(0);
      const spendableBalance = accountShape.spendableBalance || BigNumber(0);

      if (balance.isNaN()) throw new Error("invalid balance NaN");

      if (operations.length === 0 && balance.isZero()) {
        // this is an empty account
        if (derivationMode === "") {
          // is standard derivation
          if (newAccountCount === 0) {
            // first zero account will emit one account as opportunity to create a new account..
            const account: Account = {
              type: "Account",
              id: accountId,
              seedIdentifier,
              freshAddress,
              freshAddressPath,
              freshAddresses: [
                {
                  address: freshAddress,
                  derivationPath: freshAddressPath
                }
              ],
              derivationMode,
              name: getNewAccountPlaceholderName({
                currency,
                index,
                derivationMode
              }),
              index,
              currency,
              operationsCount: 0,
              operations: [],
              pendingOperations: [],
              unit: currency.units[0],
              lastSyncDate: new Date(),
              // overrides
              balance,
              spendableBalance,
              blockHeight: 0,
              ...accountShape
            };
            return { account, complete: true };
          }
          newAccountCount++;
        }

        if (shouldSkipEmpty) {
          return {};
        }
        // NB for legacy addresses maybe we will continue at least for the first 10 addresses
        return { complete: true };
      }

      const account: Account = {
        type: "Account",
        id: accountId,
        seedIdentifier: freshAddress,
        freshAddress,
        freshAddressPath,
        freshAddresses: [
          {
            address: freshAddress,
            derivationPath: freshAddressPath
          }
        ],
        derivationMode,
        name: getAccountPlaceholderName({ currency, index, derivationMode }),
        index,
        currency,
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        unit: currency.units[0],
        lastSyncDate: new Date(),
        // overrides
        balance,
        spendableBalance,
        blockHeight: 0,
        ...accountShape
      };
      return { account };
    }

    async function main() {
      // TODO switch to withDevice
      let transport;
      try {
        transport = await open(deviceId);
        const derivationModes = getDerivationModesForCurrency(currency);
        for (const derivationMode of derivationModes) {
          const path = getSeedIdentifierDerivation(currency, derivationMode);

          const result = await getAddress(transport, {
            currency,
            path,
            derivationMode
          });
          const seedIdentifier = result.publicKey;

          let emptyCount = 0;
          const mandatoryEmptyAccountSkip = getMandatoryEmptyAccountSkip(
            derivationMode
          );
          const derivationScheme = getDerivationScheme({
            derivationMode,
            currency
          });
          const stopAt = isIterableDerivationMode(derivationMode) ? 255 : 1;
          const startsAt = getDerivationModeStartsAt(derivationMode);
          for (let index = startsAt; index < stopAt; index++) {
            if (!derivationModeSupportsIndex(derivationMode, index)) continue;
            const freshAddressPath = runDerivationScheme(
              derivationScheme,
              currency,
              {
                account: index
              }
            );
            const res = await getAddress(transport, {
              currency,
              path: freshAddressPath,
              derivationMode
            });
            const r = await stepAddress(
              index,
              res,
              derivationMode,
              emptyCount < mandatoryEmptyAccountSkip,
              seedIdentifier
            );
            if (r.account) {
              o.next({ type: "discovered", account: r.account });
            } else {
              emptyCount++;
            }
            if (r.complete) {
              break;
            }
          }
        }
        o.complete();
      } catch (e) {
        o.error(e);
      } finally {
        if (transport) transport.close();
      }
    }

    main();

    return unsubscribe;
  });
