import isEqual from "lodash/isEqual";
import { BigNumber } from "bignumber.js";
import { Observable, from } from "rxjs";
import { log } from "@ledgerhq/logs";
import { WrongDeviceForAccount } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import {
  AccountShapeInfo,
  AccountUpdater,
  GetAccountShape,
  IterateResult,
  IterateResultBuilder,
  mergeOps,
  sameOp,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
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
import {
  FreshAddressIndexInvalid,
  UnsupportedDerivation,
} from "@ledgerhq/coin-framework/errors";
import getAddress from "../hw/getAddress";
import type { Result, GetAddressOptions } from "../hw/getAddress/types";
import { withDevice } from "../hw/deviceAccess";
import type {
  Account,
  AccountBridge,
  CurrencyBridge,
  ProtoNFT,
  ScanAccountEvent,
} from "@ledgerhq/types-live";

//-- Export from coin-framework
export {
  AccountShapeInfo as GetAccountShapeArg0,
  AccountUpdater,
  GetAccountShape,
  IterateResult,
  IterateResultBuilder,
  mergeOps,
  sameOp,
};

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

          const updater = (acc: Account): Account => {
            let a = acc; // a is a immutable version of Account, based on acc

            if (needClear) {
              a = clearAccount(acc);
            }

            // FIXME reconsider doing mergeOps here. work is redundant for impl like eth
            const operations = shouldMergeOps
              ? mergeOps(a.operations, shape.operations || [])
              : shape.operations || [];

            a = postSync(a, {
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

            a = recalculateAccountBalanceHistories(a, acc);

            if (!a.used) {
              a.used = !isAccountEmpty(a);
            }

            return a;
          };

          o.next(updater);
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
