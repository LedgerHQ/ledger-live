import isEqual from "lodash/isEqual";
import { BigNumber } from "bignumber.js";
import { Observable, from } from "rxjs";
import { log } from "@ledgerhq/logs";
import { WrongDeviceForAccount } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import {
  getSeedIdentifierDerivation,
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme,
  isIterableDerivationMode,
  derivationModeSupportsIndex,
  getMandatoryEmptyAccountSkip,
  getDerivationModeStartsAt,
  DerivationMode,
} from "../derivation";
import {
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
  shouldRetainPendingOperation,
  isAccountEmpty,
  shouldShowNewAccount,
  clearAccount,
  emptyHistoryCache,
  generateHistoryFromOperations,
  recalculateAccountBalanceHistories,
  encodeAccountId,
} from "../account";
import { FreshAddressIndexInvalid, UnsupportedDerivation } from "../errors";
import getAddress from "../hw/getAddress";
import type { Result, GetAddressOptions } from "../hw/getAddress/types";
import { withDevice } from "../hw/deviceAccess";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountBridge,
  CurrencyBridge,
  Operation,
  ProtoNFT,
  ScanAccountEvent,
  SyncConfig,
} from "@ledgerhq/types-live";

// Customize the way to iterate on the keychain derivation
type IterateResult = ({
  transport: Transport,
  index: number,
  derivationsCache: Object,
  derivationScheme: string,
  derivationMode: DerivationMode,
  currency: CryptoCurrency,
}) => Promise<Result | null>;

export type IterateResultBuilder = ({
  result: Result, // derivation on the "root" of the derivation
  derivationMode: DerivationMode, // identify the current derivation scheme
  derivationScheme: string,
}) => Promise<IterateResult>;

export type GetAccountShapeArg0 = {
  currency: CryptoCurrency;
  address: string;
  index: number;
  initialAccount?: Account;
  derivationPath: string;
  derivationMode: DerivationMode;
  transport?: Transport;
  rest?: any;
};

export type GetAccountShape = (
  arg0: GetAccountShapeArg0,
  arg1: SyncConfig
) => Promise<Partial<Account>>;
type AccountUpdater = (arg0: Account) => Account;

// compare that two dates are roughly the same date in order to update the case it would have drastically changed
const sameDate = (a, b) => Math.abs(a - b) < 1000 * 60 * 30;

// an operation is relatively immutable, however we saw that sometimes it can temporarily change due to reorg,..
export const sameOp = (a: Operation, b: Operation): boolean =>
  a === b ||
  (a.id === b.id && // hash, accountId, type are in id
    (a.fee ? a.fee.isEqualTo(b.fee) : a.fee === b.fee) &&
    (a.value ? a.value.isEqualTo(b.value) : a.value === b.value) &&
    a.nftOperations?.length === b.nftOperations?.length &&
    sameDate(a.date, b.date) &&
    a.blockHeight === b.blockHeight &&
    isEqual(a.senders, b.senders) &&
    isEqual(a.recipients, b.recipients));
// efficiently prepend newFetched operations to existing operations
export function mergeOps( // existing operations. sorted (newer to older). deduped.
  existing: Operation[], // new fetched operations. not sorted. not deduped. time is allowed to overlap inside existing.
  newFetched: Operation[]
): // return a list of operations, deduped and sorted from newer to older
Operation[] {
  // there is new fetched
  if (newFetched.length === 0) return existing;
  // efficient lookup map of id.
  const existingIds = {};

  for (const o of existing) {
    existingIds[o.id] = o;
  }

  // only keep the newFetched that are not in existing. this array will be mutated
  let newOps = newFetched
    .filter((o) => !existingIds[o.id] || !sameOp(existingIds[o.id], o))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  // Deduplicate new ops to guarantee operations don't have dups
  const newOpsIds = {};
  newOps.forEach((op) => {
    newOpsIds[op.id] = op;
  });
  newOps = Object.values(newOpsIds);

  // return existing when there is no real new operations
  if (newOps.length === 0) return existing;
  // edge case, existing can be empty. return the sorted list.
  if (existing.length === 0) return newOps;
  // building up merging the ops
  const all: Operation[] = [];

  for (const o of existing) {
    // prepend all the new ops that have higher date
    while (newOps.length > 0 && newOps[0].date >= o.date) {
      all.push(newOps.shift() as Operation);
    }

    if (!newOpsIds[o.id]) {
      all.push(o);
    }
  }

  return all;
}

export const mergeNfts = (
  oldNfts: ProtoNFT[],
  newNfts: ProtoNFT[]
): ProtoNFT[] => {
  // Getting a map of id => NFT
  const newNftsPerId: Record<string, ProtoNFT> = {};
  newNfts.forEach((n) => {
    newNftsPerId[n.id] = n;
  });

  // copying the argument to avoid mutating it
  const nfts = oldNfts.slice();
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];

    // The NFTs are the same, do don't anything
    if (!newNftsPerId[nft.id]) {
      nfts.splice(i, 1);
      i--;
    } else if (!isEqual(nft, newNftsPerId[nft.id])) {
      // Use the new NFT instead
      nfts[i] = newNftsPerId[nft.id];
    }

    // Delete it from the newNfts to keep only the un-added ones at the end
    delete newNftsPerId[nft.id];
  }

  // Prepending newNfts to respect nfts's newest to oldest order
  return Object.values(newNftsPerId).concat(nfts);
};

export const makeSync =
  ({
    getAccountShape,
    postSync = (_, a) => a,
    shouldMergeOps = true,
  }: {
    getAccountShape: GetAccountShape;
    postSync?: (initial: Account, synced: Account) => Account;
    shouldMergeOps?: boolean;
  }): AccountBridge<any>["sync"] =>
  (initial, syncConfig): Observable<AccountUpdater> =>
    Observable.create((o) => {
      async function main() {
        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: initial.currency.id,
          xpubOrAddress: initial.xpub || initial.freshAddress,
          derivationMode: initial.derivationMode,
        });
        const needClear = initial.id !== accountId;

        try {
          const freshAddressPath = getSeedIdentifierDerivation(
            initial.currency,
            initial.derivationMode as DerivationMode
          );

          const shape = await getAccountShape(
            {
              currency: initial.currency,
              index: initial.index,
              address: initial.freshAddress,
              derivationPath: freshAddressPath,
              derivationMode: initial.derivationMode as DerivationMode,
              initialAccount: needClear ? clearAccount(initial) : initial,
            },
            syncConfig
          );

          o.next((acc) => {
            const a = needClear ? clearAccount(acc) : acc;
            // FIXME reconsider doing mergeOps here. work is redundant for impl like eth
            const operations = shouldMergeOps
              ? mergeOps(a.operations, shape.operations || [])
              : shape.operations || [];

            return recalculateAccountBalanceHistories(
              postSync(a, {
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
              }),
              acc
            );
          });
          o.complete();
        } catch (e) {
          o.error(e);
        }
      }

      main();
    });

const iterateResultWithAddressDerivation: IterateResult = async ({
  transport,
  index,
  derivationsCache,
  derivationScheme,
  derivationMode,
  currency,
}) => {
  let res;
  const freshAddressPath = runDerivationScheme(derivationScheme, currency, {
    account: index,
  });
  res = derivationsCache[freshAddressPath];
  if (!res) {
    res = await getAddress(transport, {
      currency,
      path: freshAddressPath,
      derivationMode,
    });
    derivationsCache[freshAddressPath] = res;
  }
  return res;
};

const defaultIterateResultBuilder = () =>
  Promise.resolve(iterateResultWithAddressDerivation);

export const makeScanAccounts =
  ({
    getAccountShape,
    buildIterateResult = defaultIterateResultBuilder,
    getAddressFn,
  }: {
    getAccountShape: GetAccountShape;
    buildIterateResult?: IterateResultBuilder;
    getAddressFn?: (
      transport: Transport
    ) => (opts: GetAddressOptions) => Promise<Result>;
  }): CurrencyBridge["scanAccounts"] =>
  ({ currency, deviceId, syncConfig }): Observable<ScanAccountEvent> =>
    withDevice(deviceId)((transport) =>
      Observable.create((o) => {
        let finished = false;

        const unsubscribe = () => {
          finished = true;
        };

        const derivationsCache = {};

        async function stepAccount(
          index,
          res: Result,
          derivationMode,
          seedIdentifier,
          transport
        ): Promise<Account | null | undefined> {
          if (finished) return;

          const { address, path: freshAddressPath, ...rest } = res;

          const accountShape: Partial<Account> = await getAccountShape(
            {
              transport,
              currency,
              index,
              address,
              derivationPath: freshAddressPath,
              derivationMode,
              rest,
            },
            syncConfig
          );
          if (finished) return;

          const freshAddress = address;
          const operations = accountShape.operations || [];
          const operationsCount =
            accountShape.operationsCount || operations.length;
          const creationDate =
            operations.length > 0
              ? operations[operations.length - 1].date
              : new Date();
          const balance = accountShape.balance || new BigNumber(0);
          const spendableBalance =
            accountShape.spendableBalance || new BigNumber(0);
          if (!accountShape.id) throw new Error("account ID must be provided");
          if (balance.isNaN()) throw new Error("invalid balance NaN");
          const initialAccount: Account = {
            type: "Account",
            id: accountShape.id,
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
            balanceHistoryCache: emptyHistoryCache,
          };
          const account = { ...initialAccount, ...accountShape };

          if (account.balanceHistoryCache === emptyHistoryCache) {
            account.balanceHistoryCache =
              generateHistoryFromOperations(account);
          }

          if (!account.used) {
            account.used = !isAccountEmpty(account);
          }

          // Bitcoin needs to compute the freshAddressPath itself,
          // so we update it afterwards
          if (account?.freshAddressPath) {
            res.address = account.freshAddress;
            derivationsCache[account.freshAddressPath] = res;
          }

          log("scanAccounts", "derivationsCache", res);

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
            : getAccountPlaceholderName({
                currency,
                index,
                derivationMode,
              });

          const showNewAccount = shouldShowNewAccount(currency, derivationMode);

          if (account.used || showNewAccount) {
            log(
              "debug",
              `Emit 'discovered' event for a new account found. AccountUsed: ${account.used} - showNewAccount: ${showNewAccount}`
            );
            o.next({
              type: "discovered",
              account,
            });
          }

          return account;
        }

        async function main() {
          try {
            const getAddr = getAddressFn
              ? getAddressFn(transport)
              : (opts) => getAddress(transport, opts);
            const derivationModes = getDerivationModesForCurrency(currency);

            for (const derivationMode of derivationModes) {
              if (finished) break;
              const path = getSeedIdentifierDerivation(
                currency,
                derivationMode
              );
              log(
                "scanAccounts",
                `scanning ${currency.id} on derivationMode=${derivationMode}`
              );
              let result: Result = derivationsCache[path];

              if (!result) {
                try {
                  result = await getAddr({
                    currency,
                    path,
                    derivationMode,
                  });

                  derivationsCache[path] = result;
                } catch (e) {
                  if (e instanceof UnsupportedDerivation) {
                    log(
                      "scanAccounts",
                      "ignore derivationMode=" + derivationMode
                    );
                    continue;
                  }
                  throw e;
                }
              }

              if (!result) continue;
              const seedIdentifier = result.publicKey;
              let emptyCount = 0;
              const mandatoryEmptyAccountSkip =
                getMandatoryEmptyAccountSkip(derivationMode);
              const derivationScheme = getDerivationScheme({
                derivationMode,
                currency,
              });

              const stopAt = isIterableDerivationMode(derivationMode) ? 255 : 1;
              const startsAt = getDerivationModeStartsAt(derivationMode);

              log(
                "debug",
                `start scanning account process. MandatoryEmptyAccountSkip ${mandatoryEmptyAccountSkip} / StartsAt: ${startsAt} - StopAt: ${stopAt}`
              );

              const iterateResult = await buildIterateResult({
                result,
                derivationMode,
                derivationScheme,
              });

              for (let index = startsAt; index < stopAt; index++) {
                log("debug", `start to scan a new account. Index: ${index}`);

                if (finished) {
                  log(
                    "debug",
                    `new account scanning process has been finished`
                  );
                  break;
                }

                if (!derivationModeSupportsIndex(derivationMode, index))
                  continue;

                const res = await iterateResult({
                  transport,
                  index,
                  derivationsCache,
                  derivationMode,
                  derivationScheme,
                  currency,
                });

                if (!res) break;

                const account = await stepAccount(
                  index,
                  res,
                  derivationMode,
                  seedIdentifier,
                  transport
                );

                if (account && !account.used) {
                  if (emptyCount >= mandatoryEmptyAccountSkip) break;
                  emptyCount++;
                }
              }
            }

            o.complete();
          } catch (e) {
            o.error(e);
          }
        }

        main();
        return unsubscribe;
      })
    );
export function makeAccountBridgeReceive({
  injectGetAddressParams,
}: {
  injectGetAddressParams?: (arg0: Account) => any;
} = {}): (
  account: Account,
  arg1: {
    verify?: boolean;
    deviceId: string;
    subAccountId?: string;
    freshAddressIndex?: number;
  }
) => Observable<{
  address: string;
  path: string;
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
