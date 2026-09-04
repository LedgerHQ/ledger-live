import {
  isAddressSanctioned,
  isCheckSanctionedAddressEnabled,
} from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { CurrencyNotSupported } from "../errors";
import { decodeAccountId, getMainAccount, checkAccountSupported } from "../account";
import { getEnv } from "@shared/env";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import {
  Account,
  AccountBridge,
  AccountLike,
  CurrencyBridge,
  ResolvedAccountBridge,
  TransactionCommon,
  TransactionSource,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import { getCoinFrameworkAccountBridge } from "./generic-coin-framework/accountBridge";
import { getCoinFrameworkCurrencyBridge } from "./generic-coin-framework/currencyBridge";
import { isGenericCoinFrameworkFamily } from "./generic-coin-framework/genericCoinFrameworkFamilies";
import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import {
  loadSetupForFamily,
  loadMockBridgeForFamily,
  loadBridgeExtensionsForFamily,
} from "../coin-modules/registry";
import { defaultBridgeExtensions } from "./defaultBridgeExtensions";
import { isZcashShieldedEnabled } from "./zcashRouting";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import {
  buildBroadcastCommonEvent,
  buildSignCommonEvent,
  buildTransactionFailureEvent,
  buildTransactionSuccessEvent,
  emitTransactionEvent,
  rememberSignContext,
  TransactionPathway,
  TransactionStage,
} from "@ledgerhq/transaction-observability";

// The family owning a currency's bridge is `currency.family`, except zcash:
// `zcashShielded` routes it to the standalone "zcash" family
// (@ledgerhq/coin-zcash) instead of coin-bitcoin's chain-adapter. The flag is
// read from the mirror the host app feeds (`setZcashShieldedEnabled`), so a
// developer-drawer override moves the routing with it; the two families keep
// separate cache entries, so a flip mid-session resolves the other bridge.
function resolveFamily(currency: CryptoCurrency): string {
  return currency.id === "zcash" && isZcashShieldedEnabled() ? "zcash" : currency.family;
}

// Rejections stay cached: evicting would hand React.use() a fresh Promise per render and re-suspend forever.
// Callers that want to retry a transient failure must invalidate via clearBridgeCache(family).
const currencyBridgePromiseCache: Record<string, Promise<CurrencyBridge>> = {};
const accountBridgePromiseCache: Record<string, Promise<ResolvedAccountBridge<any>>> = {};
const mockBridgePromiseCache: Record<string, Promise<ResolvedAccountBridge<any>> | undefined> = {};
const unsupportedBridgePromiseCache: Record<string, Promise<ResolvedAccountBridge<any>>> = {};

// Annotate a Promise with React's use() hint fields so it returns synchronously after settlement.
function annotatePromise<T>(p: Promise<T>): Promise<T> {
  p.then(
    value => {
      Object.assign(p, { status: "fulfilled", value });
    },
    reason => {
      Object.assign(p, { status: "rejected", reason });
    },
  );
  return p;
}

export function clearBridgeCache(family?: string): void {
  if (family === undefined) {
    for (const k of Object.keys(currencyBridgePromiseCache)) delete currencyBridgePromiseCache[k];
    for (const k of Object.keys(accountBridgePromiseCache)) delete accountBridgePromiseCache[k];
    for (const k of Object.keys(mockBridgePromiseCache)) delete mockBridgePromiseCache[k];
    for (const k of Object.keys(unsupportedBridgePromiseCache))
      delete unsupportedBridgePromiseCache[k];
    return;
  }
  delete currencyBridgePromiseCache[family];
  delete accountBridgePromiseCache[family];
  delete mockBridgePromiseCache[family];
  const prefix = `${family}|`;
  for (const k of Object.keys(unsupportedBridgePromiseCache)) {
    if (k.startsWith(prefix)) delete unsupportedBridgePromiseCache[k];
  }
}

async function buildCurrencyBridge(currency: CryptoCurrency): Promise<CurrencyBridge> {
  const family = resolveFamily(currency);

  if (getEnv("MOCK")) {
    const mockBridge = await loadMockBridgeForFamily(family);
    // TODO Remove once we delete mock bridges tests
    if (mockBridge) {
      mockBridge.loadCoinConfig?.();
      return mockBridge.currencyBridge;
    }
    throw new CurrencyNotSupported("no mock implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }

  if (isGenericCoinFrameworkFamily(family)) {
    return getCoinFrameworkCurrencyBridge(family, "local");
  }

  const setup = await loadSetupForFamily(family);
  if (!setup?.bridge) {
    throw new CurrencyNotSupported("no implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }
  return setup.bridge.currencyBridge;
}

export const getCurrencyBridge = (currency: CryptoCurrency): Promise<CurrencyBridge> => {
  const family = resolveFamily(currency);
  if (!currencyBridgePromiseCache[family]) {
    currencyBridgePromiseCache[family] = annotatePromise(buildCurrencyBridge(currency));
  }
  return currencyBridgePromiseCache[family];
};

async function buildAccountBridgeForFamily(family: string): Promise<ResolvedAccountBridge<any>> {
  let rawBridge: AccountBridge<any>;
  if (isGenericCoinFrameworkFamily(family)) {
    rawBridge = await getCoinFrameworkAccountBridge(family, "local");
  } else {
    const setup = await loadSetupForFamily(family);
    if (!setup?.bridge) {
      throw new CurrencyNotSupported("account bridge not found " + family);
    }
    rawBridge = setup.bridge.accountBridge;
  }
  return wrapAccountBridge(rawBridge, family);
}

function getCachedBridgePromise(family: string): Promise<ResolvedAccountBridge<any>> {
  if (!accountBridgePromiseCache[family]) {
    accountBridgePromiseCache[family] = annotatePromise(buildAccountBridgeForFamily(family));
  }
  return accountBridgePromiseCache[family];
}

export function getAccountBridgeByFamily(
  family: string,
  accountId?: string,
): Promise<ResolvedAccountBridge<any>> {
  if (accountId) {
    const { type } = decodeAccountId(accountId);
    if (type === "mock") {
      if (!mockBridgePromiseCache[family]) {
        const mockP = loadMockBridgeForFamily(family);
        if (mockP) {
          mockBridgePromiseCache[family] = annotatePromise(
            (async () => {
              const mockBridge = await mockP;
              if (mockBridge) {
                // TODO Remove once we delete mock bridges tests
                mockBridge.loadCoinConfig?.();
                return wrapAccountBridge(mockBridge.accountBridge, family);
              }
              return getCachedBridgePromise(family);
            })(),
          );
        }
      }
      const cachedMock = mockBridgePromiseCache[family];
      if (cachedMock) {
        return cachedMock;
      }
    }
  }
  return getCachedBridgePromise(family);
}

export function getAccountBridge(
  account: AccountLike,
  parentAccount?: Account | null,
): Promise<ResolvedAccountBridge<any>> {
  const mainAccount = getMainAccount(account, parentAccount);
  const { currency } = mainAccount;
  const supportedError = checkAccountSupported(mainAccount);
  const family = resolveFamily(currency);

  if (supportedError) {
    const key = `${family}|${currency.id}|${mainAccount.derivationMode}`;
    if (!unsupportedBridgePromiseCache[key]) {
      unsupportedBridgePromiseCache[key] = annotatePromise(Promise.reject(supportedError));
    }
    return unsupportedBridgePromiseCache[key];
  }

  return getAccountBridgeByFamily(family, mainAccount.id);
}

/**
 * Attributes a broadcast to a {@link TransactionPathway} and a live-app manifest id from
 * `broadcastConfig.source`. `manifestId` is only set for live-app / dApp sources — a
 * "coin-module" source's `name` is the host app, not a manifest.
 */
function attributeBroadcastSource(source?: TransactionSource): {
  pathway: TransactionPathway;
  manifestId?: string;
} {
  switch (source?.type) {
    case "dApp":
      return { pathway: TransactionPathway.Dapp, manifestId: source.name };
    case "live-app":
      return { pathway: TransactionPathway.WalletApiSignAndBroadcast, manifestId: source.name };
    case "coin-module":
      return { pathway: TransactionPathway.Send };
    case "swap":
      return { pathway: TransactionPathway.Swap };
    default:
      return { pathway: TransactionPathway.Unknown };
  }
}

/**
 * The live-app or dApp that started this signature, when there is one.
 *
 * `broadcastConfig` does not exist at the sign stage, so the route is otherwise unknown until
 * broadcast — which leaves the Earn live-app skip in `toSegmentTrackEvent` unable to fire, and
 * double-counts its sign-stage failures. `withLiveAppContext` already scopes the manifest id
 * around every wallet-api and dApp signing call, so reading it here attributes the stage
 * without changing the bridge signature. That matters: mobile's legacy wallet-api path never
 * forwards the manifest to the device action, so an argument would not cover every route.
 *
 * The store is a singleton set and restored around an `await`, not an `AsyncLocalStorage`, so
 * two overlapping signatures would misattribute the second. Device signing serialises — one
 * device, one prompt — so that holds today. LIVE-36571 replaces this by passing the source
 * explicitly. Note the singleton now has two consumers, this and the blind-signing reporter.
 */
function currentLiveAppManifestId(): string | undefined {
  return liveBlindSigningReporter.getContext().liveAppContext ?? undefined;
}

// Exported for unit testing the transaction-observability seam.
export async function wrapAccountBridge<T extends TransactionCommon>(
  bridge: AccountBridge<T>,
  family: string,
): Promise<ResolvedAccountBridge<T>> {
  const extensions = await loadBridgeExtensionsForFamily(family);
  return {
    ...defaultBridgeExtensions,
    ...bridge,
    ...extensions,
    getTransactionStatus: async (...args) => {
      const blockchainTransactionStatus = await bridge.getTransactionStatus(...args);

      const account = args[0];
      if (!isCheckSanctionedAddressEnabled(account.currency)) {
        return blockchainTransactionStatus;
      }

      const commonTransactionStatus = await commonGetTransactionStatus(...args);
      return mergeResults(blockchainTransactionStatus, commonTransactionStatus);
    },
    /**
     * Transaction observability, sign stage. Only failures: a success here is not an outcome
     * the funnel cares about, and abandoning the prompt is an unsubscribe rather than an
     * error, so the device-action layer reports that instead.
     *
     * The rich transaction is available (hence the exact action and the validators).
     * `broadcastConfig` is not, so the route *type* stays unknown until broadcast — but the
     * originating manifest comes from the live-app context, see below.
     */
    signOperation: (arg0: Parameters<typeof bridge.signOperation>[0]) =>
      bridge.signOperation(arg0).pipe(
        // The signed operation is the same object `broadcast` is handed later, so remembering
        // against it carries the transaction's own wording and target across the stages.
        tap(event => {
          if (event.type === "signed") {
            rememberSignContext(
              event.signedOperation,
              arg0.account.currency.family,
              arg0.transaction,
            );
          }
        }),
        catchError(error => {
          emitTransactionEvent(
            buildTransactionFailureEvent(
              buildSignCommonEvent({
                account: arg0.account,
                mainAccount: arg0.account,
                // The manifest names the origin; the route type still needs `broadcastConfig`.
                pathway: TransactionPathway.Unknown,
                manifestId: currentLiveAppManifestId(),
                transaction: arg0.transaction,
              }),
              { stage: TransactionStage.Sign, error },
            ),
          );
          return throwError(() => error);
        }),
      ),
    /**
     * Transaction observability, broadcast stage — where a staking transaction's success is
     * actually known. Fully attributed via `broadcastConfig.source`, but the action has to be
     * read off the optimistic operation since the transaction is not passed here.
     */
    broadcast: async (arg0: Parameters<typeof bridge.broadcast>[0]) => {
      const { pathway, manifestId } = attributeBroadcastSource(arg0.broadcastConfig?.source);
      const common = buildBroadcastCommonEvent({
        account: arg0.account,
        mainAccount: arg0.account,
        pathway,
        manifestId,
        source: arg0.broadcastConfig?.source,
        signedOperation: arg0.signedOperation,
      });
      try {
        const operation = await bridge.broadcast(arg0);
        emitTransactionEvent(buildTransactionSuccessEvent(common));
        return operation;
      } catch (error) {
        emitTransactionEvent(
          buildTransactionFailureEvent(common, {
            stage: TransactionStage.Broadcast,
            error,
            signedOperation: arg0.signedOperation,
          }),
        );
        throw error;
      }
    },
  } as ResolvedAccountBridge<T>;
}

function mergeResults(
  blockchainTransactionStatus: TransactionStatusCommon,
  commonTransactionStatus: Partial<TransactionStatusCommon>,
): TransactionStatusCommon {
  const errors = { ...blockchainTransactionStatus.errors, ...commonTransactionStatus.errors };
  const warnings = { ...blockchainTransactionStatus.warnings, ...commonTransactionStatus.warnings };
  return { ...blockchainTransactionStatus, errors, warnings };
}

async function commonGetTransactionStatus(
  account: Account,
  transaction: TransactionCommon,
): Promise<Partial<TransactionStatusCommon>> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  let isRecipientSanctioned = false;
  if (transaction.recipient && transaction.recipient !== "") {
    isRecipientSanctioned = await isAddressSanctioned(account.currency, transaction.recipient);
    if (isRecipientSanctioned) {
      errors.recipient = new AddressesSanctionedError("AddressesSanctionedError", {
        addresses: [transaction.recipient],
      });
    }
  }

  const isSenderSanctioned = await isAddressSanctioned(account.currency, account.freshAddress);
  if (isSenderSanctioned) {
    errors.sender = new AddressesSanctionedError("AddressesSanctionedError", {
      addresses: [account.freshAddress],
    });
  }

  return { errors, warnings };
}
