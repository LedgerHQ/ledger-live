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
import { getAlpacaAccountBridge } from "./generic-coin-framework/accountBridge";
import { getAlpacaCurrencyBridge } from "./generic-coin-framework/currencyBridge";
import { isGenericCoinFrameworkFamily } from "./generic-coin-framework/genericCoinFrameworkFamilies";
import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import {
  loadSetupForFamily,
  loadMockBridgeForFamily,
  loadBridgeExtensionsForFamily,
} from "../coin-modules/registry";
import { defaultBridgeExtensions } from "./defaultBridgeExtensions";

// Generic Coin Framework currency bridges are created on demand; cache ensures referential stability.
const currencyBridgeCache: Record<string, CurrencyBridge> = {};
// All account bridges are wrapped (wrapAccountBridge); cache ensures referential stability.
const accountBridgeCache: Record<string, ResolvedAccountBridge<any>> = {};

/**
 * Returns the CurrencyBridge for a given CryptoCurrency.
 *
 * **Ongoing migration**: this function will become async as part of the ESM coin modules migration
 * (dynamic `import()` replacing synchronous `require()`). Write call sites that are async-compatible today:
 *
 * - **React component**: use the `useCurrencyBridge(currency)` hook instead — it handles loading states.
 * - **RxJS observable**: wrap with `from(Promise.resolve(getCurrencyBridge(currency))).pipe(mergeMap(bridge => ...))`
 * - **async function**:
 *   - ❌ `const bridge = getCurrencyBridge(currency)` — not forward-compatible
 *   - ✅ `const bridge = await Promise.resolve(getCurrencyBridge(currency))` — compatible with both sync and future async forms.
 */
export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  if (getEnv("MOCK")) {
    const mockBridge = loadMockBridgeForFamily(currency.family);
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
    if (!currencyBridgeCache[currency.family]) {
      currencyBridgeCache[currency.family] = getAlpacaCurrencyBridge(currency.family, "local");
    }
    return currencyBridgeCache[currency.family];
  }

  const setup = loadSetupForFamily(currency.family);
  if (!setup?.bridge) {
    throw new CurrencyNotSupported("no implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }
  return setup.bridge.currencyBridge;
};

/**
 * Returns the AccountBridge for a given account (and optional parent account).
 *
 * **Ongoing migration**: this function will become async as part of the ESM coin modules migration
 * (dynamic `import()` replacing synchronous `require()`). Write call sites that are async-compatible today:
 *
 * - **React component**: use the `useAccountBridge(account)` hook instead — it handles loading states.
 * - **RxJS observable**: wrap with `from(Promise.resolve(getAccountBridge(account))).pipe(mergeMap(bridge => ...))`
 * - **async function**:
 *   - ❌ `const bridge = getAccountBridge(account)` — not forward-compatible
 *   - ✅ `const bridge = await Promise.resolve(getAccountBridge(account))` — compatible with both sync and future async forms.
 */
export const getAccountBridge = (
  account: AccountLike,
  parentAccount?: Account | null,
): ResolvedAccountBridge<any> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { currency } = mainAccount;
  const supportedError = checkAccountSupported(mainAccount);

  if (supportedError) {
    throw supportedError;
  }

  try {
    return getAccountBridgeByFamily(currency.family, mainAccount.id);
  } catch {
    throw new CurrencyNotSupported("currency not supported " + currency.id, {
      currencyName: currency.id,
    });
  }
};

export function getAccountBridgeByFamily(
  family: string,
  accountId?: string,
): ResolvedAccountBridge<any> {
  if (accountId) {
    const { type } = decodeAccountId(accountId);

    if (type === "mock") {
      const mockBridge = loadMockBridgeForFamily(family);
      // TODO Remove once we delete mock bridges tests
      if (mockBridge) {
        mockBridge.loadCoinConfig?.();
        return wrapAccountBridge(mockBridge.accountBridge, family);
      }
    }
  }

  if (!accountBridgeCache[family]) {
    let rawBridge: AccountBridge<any>;
    if (isGenericCoinFrameworkFamily(family)) {
      rawBridge = getAlpacaAccountBridge(family, "local");
    } else {
      const setup = loadSetupForFamily(family);
      if (!setup?.bridge) {
        throw new CurrencyNotSupported("account bridge not found " + family);
      }
      rawBridge = setup.bridge.accountBridge;
    }
    accountBridgeCache[family] = wrapAccountBridge(rawBridge, family);
  }
  return accountBridgeCache[family];
}

function wrapAccountBridge<T extends TransactionCommon>(
  bridge: AccountBridge<T>,
  family: string,
): ResolvedAccountBridge<T> {
  return {
    ...defaultBridgeExtensions,
    ...bridge,
    ...loadBridgeExtensionsForFamily(family),
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
