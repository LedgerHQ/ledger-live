import bippath from "bip32-path";
import isEqual from "lodash/isEqual";
import { BigNumber } from "bignumber.js";
import { Observable, Observer, Subscriber, Subscription, from, map, of } from "rxjs";
import { log } from "@ledgerhq/logs";
import { WrongDeviceForAccount } from "@ledgerhq/errors";
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
import { isAccountEmpty, clearAccount, emptyHistoryCache, encodeAccountId } from "../account";
import {
  generateHistoryFromOperations,
  recalculateAccountBalanceHistories,
} from "../account/balanceHistoryCache";
import { shouldRetainPendingOperation } from "../account/pending";
import { shouldShowNewAccount } from "../account/support";
import { UnsupportedDerivation } from "../errors";
import getAddressWrapper, { GetAddressFn } from "./getAddressWrapper";
import type { Result } from "../derivation";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountBridge,
  AccountRaw,
  CurrencyBridge,
  DerivationMode,
  Operation,
  ProtoNFT,
  ScanAccountEvent,
  SyncConfig,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";

// Customize the way to iterate on the keychain derivation
type IterateResult = ({
  index,
  derivationsCache,
  derivationScheme,
  derivationMode,
  currency,
  deviceId,
}: {
  index: number;
  derivationsCache: Record<string, Result>;
  derivationScheme: string;
  derivationMode: DerivationMode;
  currency: CryptoCurrency;
  deviceId: string;
}) => Promise<Result | null>;

export type IterateResultBuilder = ({
  result, // derivation on the "root" of the derivation
  derivationMode, // identify the current derivation scheme
  derivationScheme,
}: {
  result: Result;
  derivationMode: DerivationMode;
  derivationScheme: string;
}) => Promise<IterateResult>;

export type AccountShapeInfo<A extends Account = Account> = {
  currency: CryptoCurrency;
  address: string;
  index: number;
  initialAccount?: A | undefined;
  derivationPath: string;
  derivationMode: DerivationMode;
  rest?: any;
  deviceId?: string;
};

export type GetAccountShape<A extends Account = Account> = (
  accountShape: AccountShapeInfo<A>,
  config: SyncConfig,
) => Promise<Partial<A>>;

export type GetAccountShapeStream<A extends Account = Account> = (
  accountShape: AccountShapeInfo<A>,
  config: SyncConfig,
) => Observable<Partial<A>>;

/**
 * Normalizes a Promise or Observable to an Observable.
 * This helper function allows the framework to handle both Promise-based
 * and Observable-based getAccountShape implementations uniformly.
 *
 * @param value - Either a Promise or Observable
 * @returns An Observable
 */
function normalizeToObservable<T>(value: Promise<T> | Observable<T>): Observable<T> {
  // Check if it's already an Observable by checking for the subscribe method
  if (value && typeof (value as Observable<T>).subscribe === "function") {
    return value as Observable<T>;
  }
  // Otherwise, it's a Promise, wrap it with from()
  return from(value as Promise<T>);
}

type AccountUpdater<A extends Account = Account> = (account: A) => A;

type ScanContext = {
  isFinished: () => boolean;
  inFlightResolvers: Set<() => void>;
  inFlightPromises: Set<Promise<void>>;
  scanAccountsConcurrency: number;
  subscriptions: Array<{ unsubscribe: () => void }>;
  trackInFlight: (promise: Promise<void>) => Promise<void>;
  unsubscribe: () => void;
};

const resolveDerivationModes = (
  currency: CryptoCurrency,
  scheme: DerivationMode | undefined | null,
): DerivationMode[] =>
  scheme === null || scheme === undefined ? getDerivationModesForCurrency(currency) : [scheme];

const buildAccountId = (initial: Account): { accountId: string; needClear: boolean } => {
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: initial.currency.id,
    xpubOrAddress: initial.xpub || initial.freshAddress,
    derivationMode: initial.derivationMode,
  });
  return { accountId, needClear: initial.id !== accountId };
};

const buildAccountShapeInfo = <A extends Account>(
  initial: A,
  needClear: boolean,
): AccountShapeInfo<A> => ({
  currency: initial.currency,
  index: initial.index,
  address: initial.freshAddress,
  derivationPath: getSeedIdentifierDerivation(
    initial.currency,
    initial.derivationMode as DerivationMode,
  ),
  derivationMode: initial.derivationMode as DerivationMode,
  initialAccount: needClear ? clearAccount(initial) : initial,
});

const createAccountUpdater =
  <A extends Account>({
    accountId,
    needClear,
    shouldMergeOps,
    postSync,
  }: {
    accountId: string;
    needClear: boolean;
    shouldMergeOps: boolean;
    postSync: (initial: A, synced: A) => A;
  }) =>
  (shape: Partial<A>) =>
  (acc: A): A => {
    let a = acc; // a is a immutable version of Account, based on acc

    if (needClear) {
      a = clearAccount(acc);
    }

    // FIXME reconsider doing mergeOps here. work is redundant for impl like eth
    const operations = shouldMergeOps
      ? mergeOps(a.operations, shape.operations || [])
      : shape.operations || [];

    const spendableBalance = shape.spendableBalance ?? shape.balance ?? a.spendableBalance;
    a = postSync(a, {
      ...a,
      id: accountId,
      spendableBalance,
      operationsCount: shape.operationsCount || operations.length,
      lastSyncDate: new Date(),
      creationDate: operations.at(-1)?.date ?? new Date(),
      ...shape,
      operations,
      pendingOperations: a.pendingOperations.filter(op => shouldRetainPendingOperation(a, op)),
    });

    a = recalculateAccountBalanceHistories(a, acc);

    if (!a.used) {
      a.used = !isAccountEmpty(a);
    }

    return a;
  };

const buildInitialAccount = ({
  accountShape,
  seedIdentifier,
  currency,
  derivationMode,
  index,
  freshAddress,
  freshAddressPath,
}: {
  accountShape: Partial<Account>;
  seedIdentifier: string;
  currency: CryptoCurrency;
  derivationMode: DerivationMode;
  index: number;
  freshAddress: string;
  freshAddressPath: string;
}): Account => {
  const operations = accountShape.operations || [];
  const operationsCount = accountShape.operationsCount || operations.length;
  const creationDate = operations.length > 0 ? operations[operations.length - 1].date : new Date();
  const balance = accountShape.balance || new BigNumber(0);
  const spendableBalance = accountShape.spendableBalance || new BigNumber(0);
  if (!accountShape.id) throw new Error("account ID must be provided");
  if (balance.isNaN()) throw new Error("invalid balance NaN");
  return {
    type: "Account",
    id: accountShape.id,
    seedIdentifier,
    freshAddress,
    freshAddressPath,
    derivationMode,
    used: false,
    index,
    currency,
    operationsCount,
    operations: [],
    swapHistory: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    creationDate,
    // overrides
    balance,
    spendableBalance,
    blockHeight: 0,
    balanceHistoryCache: emptyHistoryCache,
  };
};

const createStepAccount =
  <A extends Account>({
    currency,
    deviceId,
    syncConfig,
    getAccountShape,
    postSync,
    derivationsCache,
    isFinished,
  }: {
    currency: CryptoCurrency;
    deviceId: string;
    syncConfig: SyncConfig;
    getAccountShape: GetAccountShape<A> | GetAccountShapeStream<A>;
    postSync: (initial: A, synced: A) => A;
    derivationsCache: Record<string, Result>;
    isFinished: () => boolean;
  }) =>
  (
    index: number,
    res: Result,
    derivationMode: DerivationMode,
    seedIdentifier: string,
  ): Observable<Account | null | undefined> => {
    if (isFinished()) return of(null);

    const { address, path: freshAddressPath, ...rest } = res;

    const accountShapeResult = getAccountShape(
      {
        currency,
        index,
        address,
        derivationPath: freshAddressPath,
        derivationMode,
        rest,
        deviceId,
      },
      syncConfig,
    );

    const accountShape$: Observable<Partial<Account>> = normalizeToObservable(accountShapeResult);
    if (isFinished()) return of(null);

    return accountShape$.pipe(
      map(accountShape => {
        const initialAccount = buildInitialAccount({
          accountShape,
          seedIdentifier,
          currency,
          derivationMode,
          index,
          freshAddress: address,
          freshAddressPath,
        });
        let account = { ...initialAccount, ...accountShape };

        if (account.balanceHistoryCache === emptyHistoryCache) {
          account.balanceHistoryCache = generateHistoryFromOperations(account);
        }

        if (accountShape.used === undefined) {
          account.used = !isAccountEmpty(account);
        }

        // Bitcoin needs to compute the freshAddressPath itself,
        // so we update it afterwards
        if (account?.freshAddressPath) {
          res.address = account.freshAddress;
          derivationsCache[account.freshAddressPath] = res;
        }

        // Temporary: we're going to remove transformations in postSync that should be done in getAccountShape
        // Using the generic doesn't resolve correctly
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        account = postSync(initialAccount as unknown as A, account as unknown as A);

        log("scanAccounts", "derivationsCache", res);

        log(
          "scanAccounts",
          `scanning ${currency.id} at ${freshAddressPath}: ${res.address} resulted of ${
            account ? `Account with ${account.operations.length} txs` : "no account"
          }`,
        );

        return account;
      }),
    );
  };

const createScanContext = (syncConfig: SyncConfig): ScanContext => {
  let finished = false;
  const subscriptions: Array<{ unsubscribe: () => void }> = [];
  const inFlightPromises = new Set<Promise<void>>();
  const inFlightResolvers = new Set<() => void>();
  const scanAccountsConcurrency = Math.max(1, syncConfig.scanAccountsConcurrency ?? 1);

  const resolveInFlight = () => {
    inFlightResolvers.forEach(resolve => resolve());
    inFlightResolvers.clear();
  };

  const trackInFlight = (promise: Promise<void>) => {
    const trackedPromise = promise.catch(() => {
      // Intentionally swallow the error here; it should be surfaced
      // through the outer observable/error handling mechanisms.
    });
    inFlightPromises.add(trackedPromise);
    trackedPromise.finally(() => {
      inFlightPromises.delete(trackedPromise);
    });
    return promise;
  };

  const unsubscribe = () => {
    finished = true;
    subscriptions.forEach(sub => sub.unsubscribe());
    subscriptions.length = 0;
    resolveInFlight();
  };

  return {
    isFinished: () => finished,
    inFlightResolvers,
    inFlightPromises,
    scanAccountsConcurrency,
    subscriptions,
    trackInFlight,
    unsubscribe,
  };
};

// compare that two dates are roughly the same date in order to update the case it would have drastically changed
const sameDate = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) < 1000 * 60 * 30;

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
export function mergeOps(
  existing: Operation[], // existing operations. sorted (newer to older). deduped.
  newFetched: Operation[], // new fetched operations. not sorted. not deduped. time is allowed to overlap inside existing.
): // return a list of operations, deduped and sorted from newer to older
Operation[] {
  // there is new fetched
  if (newFetched.length === 0) return existing;
  // efficient lookup map of id.
  const existingIds: Record<string, Operation> = {};

  for (const o of existing) {
    existingIds[o.id] = o;
  }

  // only keep the newFetched that are not in existing. this array will be mutated
  let newOps = newFetched
    .filter(o => !existingIds[o.id] || !sameOp(existingIds[o.id], o))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  // Deduplicate new ops to guarantee operations don't have dups
  const newOpsIds: Record<string, Operation> = {};
  newOps.forEach(op => {
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

export const mergeNfts = (oldNfts: ProtoNFT[], newNfts: ProtoNFT[]): ProtoNFT[] => {
  // Getting a map of id => NFT
  const newNftsPerId: Record<string, ProtoNFT> = {};
  newNfts.forEach(n => {
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
  <
    T extends TransactionCommon = TransactionCommon,
    A extends Account = Account,
    U extends TransactionStatusCommon = TransactionStatusCommon,
    O extends Operation = Operation,
    R extends AccountRaw = AccountRaw,
  >({
    getAccountShape,
    postSync = (_, a) => a,
    shouldMergeOps = true,
  }: {
    getAccountShape: GetAccountShape<A> | GetAccountShapeStream<A>;
    postSync?: (initial: A, synced: A) => A;
    shouldMergeOps?: boolean;
  }): AccountBridge<T, A, U, O, R>["sync"] =>
  (initial: A, syncConfig: SyncConfig): Observable<AccountUpdater<A>> =>
    new Observable((o: Subscriber<AccountUpdater<A>>) => {
      const { accountId, needClear } = buildAccountId(initial);
      const updater = createAccountUpdater<A>({
        accountId,
        needClear,
        shouldMergeOps,
        postSync,
      });
      let subscription: { unsubscribe: () => void } | undefined;

      const safeNext = (shape: Partial<A>) => {
        if (!o.closed) {
          o.next(updater(shape));
        }
      };
      const safeComplete = () => {
        if (!o.closed) {
          o.complete();
        }
      };
      const safeError = (error: unknown) => {
        if (!o.closed) {
          o.error(error);
        }
      };

      try {
        const shapeResult = getAccountShape(buildAccountShapeInfo(initial, needClear), syncConfig);
        const shape$ = normalizeToObservable(shapeResult);
        subscription = shape$.subscribe({
          next: safeNext,
          complete: safeComplete,
          error: safeError,
        });
      } catch (e) {
        safeError(e);
      }

      return () => {
        subscription?.unsubscribe();
      };
    });

const defaultIterateResultBuilder = (getAddressFn: GetAddressFn) => () =>
  Promise.resolve(
    async ({
      index,
      derivationsCache,
      derivationScheme,
      derivationMode,
      currency,
      deviceId,
    }: {
      index: number | string;
      derivationsCache: Record<string, Result>;
      derivationScheme: string;
      derivationMode: DerivationMode;
      currency: CryptoCurrency;
      deviceId: string;
    }): Promise<Result | null> => {
      const freshAddressPath = runDerivationScheme(derivationScheme, currency, {
        account: index,
      });
      let res = derivationsCache[freshAddressPath];
      if (!res) {
        res = await getAddressWrapper(getAddressFn)(deviceId, {
          currency,
          path: freshAddressPath,
          derivationMode,
        });
        derivationsCache[freshAddressPath] = res;
      }
      return res as Result;
    },
  );

type ScanAccountsObserver = Observer<ScanAccountEvent>;

type RunAccountParams = {
  index: number;
  res: Result;
  stepAccount: (
    index: number,
    res: Result,
    derivationMode: DerivationMode,
    seedIdentifier: string,
  ) => Observable<Account | null | undefined>;
  derivationMode: DerivationMode;
  seedIdentifier: string;
  scanContext: ScanContext;
  currency: CryptoCurrency;
  mandatoryEmptyAccountSkip: number;
  emptyAccountState: { count: number; stopRequested: boolean };
  observer: ScanAccountsObserver;
};

const runAccountScan = ({
  index,
  res,
  stepAccount,
  derivationMode,
  seedIdentifier,
  scanContext,
  currency,
  mandatoryEmptyAccountSkip,
  emptyAccountState,
  observer,
}: RunAccountParams): Promise<void> =>
  new Promise((resolve, reject) => {
    if (scanContext.isFinished()) {
      resolve();
      return;
    }

    let settled = false;
    let didEmit = false;
    let lastAccount: Account | null = null;
    const resolvePromise = () => {
      if (settled) return;
      settled = true;
      scanContext.inFlightResolvers.delete(resolvePromise);
      resolve();
    };
    const rejectPromise = (error: Error) => {
      if (settled) return;
      settled = true;
      scanContext.inFlightResolvers.delete(resolvePromise);
      reject(error);
    };

    scanContext.inFlightResolvers.add(resolvePromise);

    const account$ = stepAccount(index, res, derivationMode, seedIdentifier);
    const subscriptionContainer = new Subscription();
    scanContext.subscriptions.push(subscriptionContainer);
    const subscription = account$.subscribe({
      next: account => {
        didEmit = true;
        if (account) {
          lastAccount = account;
          const showNewAccount = shouldShowNewAccount(currency, derivationMode);

          if (account.used || showNewAccount) {
            log(
              "debug",
              `Emit 'discovered' event for a new account found. AccountUsed: ${account.used} - showNewAccount: ${showNewAccount}`,
            );
            if (!scanContext.isFinished()) {
              observer.next({
                type: "discovered",
                account,
              });
            }
          }
        }
      },
      complete: () => {
        if (scanContext.isFinished()) {
          resolvePromise();
          return;
        }

        const shouldCountEmpty = !didEmit || (lastAccount && !lastAccount.used);
        if (shouldCountEmpty) {
          if (emptyAccountState.count >= mandatoryEmptyAccountSkip) {
            emptyAccountState.stopRequested = true;
            resolvePromise();
            return;
          }
          emptyAccountState.count++;
        }

        resolvePromise();
      },
      error: e => {
        const message = typeof e === "string" ? e : String(e);

        const normalizedError = e instanceof Error ? e : new Error(message);

        if (!scanContext.isFinished()) {
          scanContext.unsubscribe();
          observer.error(normalizedError);
        }

        rejectPromise(normalizedError);
      },
    });
    subscriptionContainer.add(subscription);
  });

type ScanDerivationModeParams = {
  derivationMode: DerivationMode;
  currency: CryptoCurrency;
  deviceId: string;
  scanContext: ScanContext;
  derivationsCache: Record<string, Result>;
  getAddressFn: GetAddressFn;
  stepAccount: (
    index: number,
    res: Result,
    derivationMode: DerivationMode,
    seedIdentifier: string,
  ) => Observable<Account | null | undefined>;
  observer: ScanAccountsObserver;
  buildIterateResult: IterateResultBuilder;
};

type DerivationModeResultStatus = "ok" | "unsupported" | "empty";

const resolveDerivationModeResult = async ({
  derivationMode,
  currency,
  deviceId,
  derivationsCache,
  getAddressFn,
}: {
  derivationMode: DerivationMode;
  currency: CryptoCurrency;
  deviceId: string;
  derivationsCache: Record<string, Result>;
  getAddressFn: GetAddressFn;
}): Promise<{ status: DerivationModeResultStatus; result: Result | null }> => {
  const path = getSeedIdentifierDerivation(currency, derivationMode);
  log("scanAccounts", `scanning ${currency.id} on derivationMode=${derivationMode}`);
  let result: Result = derivationsCache[path];

  if (!result) {
    try {
      result = await getAddressFn(deviceId, {
        currency,
        path,
        derivationMode,
      });
      derivationsCache[path] = result;
    } catch (e) {
      if (e instanceof UnsupportedDerivation) {
        log("scanAccounts", "ignore derivationMode=" + derivationMode);
        return { status: "unsupported", result: null };
      }
      throw e;
    }
  }

  return { status: result ? "ok" : "empty", result };
};

const buildDerivationModeScanState = async ({
  result,
  derivationMode,
  currency,
  buildIterateResult,
}: {
  result: Result;
  derivationMode: DerivationMode;
  currency: CryptoCurrency;
  buildIterateResult: IterateResultBuilder;
}) => {
  const seedIdentifier = result.publicKey;
  const emptyAccountState = { count: 0, stopRequested: false };
  const mandatoryEmptyAccountSkip = getMandatoryEmptyAccountSkip(derivationMode);
  const derivationScheme = getDerivationScheme({
    derivationMode,
    currency,
  });
  const stopAt = isIterableDerivationMode(derivationMode) ? 255 : 1;
  const startsAt = getDerivationModeStartsAt(derivationMode);
  const iterateResult = await buildIterateResult({
    result,
    derivationMode,
    derivationScheme,
  });

  return {
    seedIdentifier,
    emptyAccountState,
    mandatoryEmptyAccountSkip,
    derivationScheme,
    stopAt,
    startsAt,
    iterateResult,
  };
};

type RunDerivationModeLoopParams = {
  startsAt: number;
  stopAt: number;
  derivationMode: DerivationMode;
  derivationScheme: string;
  currency: CryptoCurrency;
  deviceId: string;
  derivationsCache: Record<string, Result>;
  iterateResult: IterateResult;
  seedIdentifier: string;
  emptyAccountState: { count: number; stopRequested: boolean };
  mandatoryEmptyAccountSkip: number;
  scanContext: ScanContext;
  stepAccount: (
    index: number,
    res: Result,
    derivationMode: DerivationMode,
    seedIdentifier: string,
  ) => Observable<Account | null | undefined>;
  observer: ScanAccountsObserver;
  modePromises: Array<Promise<void>>;
};

const runDerivationModeLoop = async ({
  startsAt,
  stopAt,
  derivationMode,
  derivationScheme,
  currency,
  deviceId,
  derivationsCache,
  iterateResult,
  seedIdentifier,
  emptyAccountState,
  mandatoryEmptyAccountSkip,
  scanContext,
  stepAccount,
  observer,
  modePromises,
}: RunDerivationModeLoopParams): Promise<void> => {
  for (let index = startsAt; index < stopAt; index++) {
    if (emptyAccountState.stopRequested) {
      break;
    }
    log("debug", `start to scan a new account. Index: ${index}`);

    if (scanContext.isFinished()) {
      log("debug", `new account scanning process has been finished`);
      break;
    }

    if (!derivationModeSupportsIndex(derivationMode, index)) continue;

    const res = await iterateResult({
      index,
      derivationsCache,
      derivationMode,
      derivationScheme,
      currency,
      deviceId,
    });

    if (!res) break;

    const runPromise = runAccountScan({
      index,
      res,
      stepAccount,
      derivationMode,
      seedIdentifier,
      scanContext,
      currency,
      mandatoryEmptyAccountSkip,
      emptyAccountState,
      observer,
    });
    modePromises.push(runPromise);
    scanContext.trackInFlight(runPromise);

    if (scanContext.inFlightPromises.size >= scanContext.scanAccountsConcurrency) {
      await Promise.race(scanContext.inFlightPromises);
    }

    if (scanContext.isFinished()) break;
  }
};

const scanDerivationMode = async ({
  derivationMode,
  currency,
  deviceId,
  scanContext,
  derivationsCache,
  getAddressFn,
  stepAccount,
  observer,
  buildIterateResult,
}: ScanDerivationModeParams): Promise<void> => {
  if (scanContext.isFinished()) return;
  const { status, result } = await resolveDerivationModeResult({
    derivationMode,
    currency,
    deviceId,
    derivationsCache,
    getAddressFn,
  });
  if (status !== "ok" || !result) return;

  const {
    seedIdentifier,
    emptyAccountState,
    mandatoryEmptyAccountSkip,
    derivationScheme,
    stopAt,
    startsAt,
    iterateResult,
  } = await buildDerivationModeScanState({
    result,
    derivationMode,
    currency,
    buildIterateResult,
  });

  log(
    "debug",
    `start scanning account process. MandatoryEmptyAccountSkip ${mandatoryEmptyAccountSkip} / StartsAt: ${startsAt} - StopAt: ${stopAt}`,
  );

  const modePromises: Array<Promise<void>> = [];
  await runDerivationModeLoop({
    startsAt,
    stopAt,
    derivationMode,
    derivationScheme,
    currency,
    deviceId,
    derivationsCache,
    iterateResult,
    seedIdentifier,
    emptyAccountState,
    mandatoryEmptyAccountSkip,
    scanContext,
    stepAccount,
    observer,
    modePromises,
  });

  await Promise.all(modePromises);
};

type RunScanAccountsParams = {
  currency: CryptoCurrency;
  deviceId: string;
  scheme: DerivationMode | null | undefined;
  scanContext: ScanContext;
  derivationsCache: Record<string, Result>;
  getAddressFn: GetAddressFn;
  stepAccount: (
    index: number,
    res: Result,
    derivationMode: DerivationMode,
    seedIdentifier: string,
  ) => Observable<Account | null | undefined>;
  observer: ScanAccountsObserver;
  buildIterateResult: IterateResultBuilder;
};

const runScanAccounts = async ({
  currency,
  deviceId,
  scheme,
  scanContext,
  derivationsCache,
  getAddressFn,
  stepAccount,
  observer,
  buildIterateResult,
}: RunScanAccountsParams): Promise<void> => {
  if (scanContext.isFinished()) return;
  try {
    const derivationModes = resolveDerivationModes(currency, scheme);

    for (const derivationMode of derivationModes) {
      if (scanContext.isFinished()) break;
      await scanDerivationMode({
        derivationMode,
        currency,
        deviceId,
        scanContext,
        derivationsCache,
        getAddressFn,
        stepAccount,
        observer,
        buildIterateResult,
      });
    }

    if (!scanContext.isFinished()) {
      await Promise.all(scanContext.inFlightPromises);
      if (!scanContext.isFinished()) observer.complete();
    }
  } catch (e) {
    if (!scanContext.isFinished()) observer.error(e);
  }
};

export const makeScanAccounts =
  <A extends Account = Account>({
    getAccountShape,
    buildIterateResult,
    getAddressFn,
    postSync = (_, a) => a,
  }: {
    getAccountShape: GetAccountShape<A> | GetAccountShapeStream<A>;
    buildIterateResult?: IterateResultBuilder;
    getAddressFn: GetAddressFn;
    postSync?: (initial: A, synced: A) => A;
  }): CurrencyBridge["scanAccounts"] =>
  ({ currency, deviceId, syncConfig, scheme }): Observable<ScanAccountEvent> =>
    new Observable((o: ScanAccountsObserver) => {
      const iterateResultBuilder = buildIterateResult ?? defaultIterateResultBuilder(getAddressFn);
      const scanContext = createScanContext(syncConfig);
      const derivationsCache: Record<string, Result> = {};
      const stepAccount = createStepAccount<A>({
        currency,
        deviceId,
        syncConfig,
        getAccountShape,
        postSync,
        derivationsCache,
        isFinished: scanContext.isFinished,
      });
      const scanPromise = runScanAccounts({
        currency,
        deviceId,
        scheme,
        scanContext,
        derivationsCache,
        getAddressFn,
        stepAccount,
        observer: o,
        buildIterateResult: iterateResultBuilder,
      });
      scanPromise.catch(() => {
        // Errors are handled via observer.error; this avoids unhandled rejections.
      });
      return scanContext.unsubscribe;
    });

export function makeAccountBridgeReceive<A extends Account = Account>(
  getAddressFn: GetAddressFn,
  {
    injectGetAddressParams,
  }: {
    injectGetAddressParams?: (account: A) => any;
  } = {},
) {
  return (
    account: A,
    {
      verify,
      deviceId,
      path,
    }: {
      verify?: boolean;
      deviceId: string;
      subAccountId?: string;
      path?: string;
    },
  ) => {
    const arg = {
      verify,
      currency: account.currency,
      derivationMode: account.derivationMode,
      path: path || account.freshAddressPath,
      ...(injectGetAddressParams && injectGetAddressParams(account)),
    };
    return from(
      getAddressFn(deviceId, arg).then(r => {
        const accountAddress = account.freshAddress;

        if (verify && r.address !== accountAddress) {
          throw new WrongDeviceForAccount();
        }

        return r;
      }),
    );
  };
}

/**
 * Default trivial implem for updateTransaction, that keeps reference stability (for React)
 */
export function updateTransaction<T extends TransactionCommon>(t: T, patch: Partial<T>): T {
  const patched = { ...t, ...patch };
  return isEqual(t, patched) ? t : patched;
}

/**
 * Default trivial implem for getSerializedAddressParameters
 */
export function getSerializedAddressParameters(account: Account): Buffer {
  return bip32asBuffer(account.freshAddressPath);
}

export function bip32asBuffer(path: string): Buffer {
  const pathElements = !path ? [] : bippath.fromString(path).toPathArray();

  const buffer = Buffer.alloc(1 + pathElements.length * 4);
  buffer[0] = pathElements.length;
  pathElements.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
}
