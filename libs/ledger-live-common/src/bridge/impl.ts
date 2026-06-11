import {
  isAddressSanctioned,
  isCheckSanctionedAddressEnabled,
} from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { CurrencyNotSupported } from "@ledgerhq/errors";
import { decodeAccountId, getMainAccount, checkAccountSupported } from "../account";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  Account,
  AccountBridge,
  AccountLike,
  CurrencyBridge,
  ResolvedAccountBridge,
  TransactionCommon,
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
  if (getEnv("MOCK")) {
    const mockBridge = await loadMockBridgeForFamily(currency.family);
    // TODO Remove once we delete mock bridges tests
    if (mockBridge) {
      mockBridge.loadCoinConfig?.();
      return mockBridge.currencyBridge;
    }
    throw new CurrencyNotSupported("no mock implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }

  if (isGenericCoinFrameworkFamily(currency.family)) {
    return getCoinFrameworkCurrencyBridge(currency.family, "local");
  }

  const setup = await loadSetupForFamily(currency.family);
  if (!setup?.bridge) {
    throw new CurrencyNotSupported("no implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }
  return setup.bridge.currencyBridge;
}

export const getCurrencyBridge = (currency: CryptoCurrency): Promise<CurrencyBridge> => {
  const family = currency.family;
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

  if (supportedError) {
    const key = `${currency.family}|${currency.id}|${mainAccount.derivationMode}`;
    if (!unsupportedBridgePromiseCache[key]) {
      unsupportedBridgePromiseCache[key] = annotatePromise(Promise.reject(supportedError));
    }
    return unsupportedBridgePromiseCache[key];
  }

  return getAccountBridgeByFamily(currency.family, mainAccount.id);
}

async function wrapAccountBridge<T extends TransactionCommon>(
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
