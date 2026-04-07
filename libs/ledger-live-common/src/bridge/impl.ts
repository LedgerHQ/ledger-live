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
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import { getAlpacaAccountBridge } from "./generic-alpaca/accountBridge";
import { getAlpacaCurrencyBridge } from "./generic-alpaca/currencyBridge";
import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { loadSetupForFamily, loadMockBridgeForFamily } from "../coin-modules/registry";

const alpacaized = {
  evm: true,
  xrp: true,
  stellar: true,
  tezos: true,
  solana: false, // TODO: Enable once solana is ready to be used in production
};

const bridgeCache: Record<string, AccountBridge<any>> = {};
const currencyBridgeCache: Record<string, CurrencyBridge> = {};
const mockBridgeCache: Record<string, any> = {};

/** Lazily load and cache a mock bridge for a family. */
async function loadMockBridgeForFamilyLazy(family: string): Promise<any> {
  if (mockBridgeCache[family]) return mockBridgeCache[family];
  const bridge = await loadMockBridgeForFamily(family);
  if (bridge !== undefined) mockBridgeCache[family] = bridge;
  return bridge;
}

/**
 * Async: loads the currency bridge for a currency, caching the result.
 */
export const getCurrencyBridge = async (currency: CryptoCurrency): Promise<CurrencyBridge> => {
  if (getEnv("MOCK")) {
    const cached = await loadMockBridgeForFamilyLazy(currency.family);
    if (cached) {
      if (typeof cached.loadCoinConfig === "function") {
        cached.loadCoinConfig();
      }
      return cached.currencyBridge;
    }
    throw new CurrencyNotSupported("no mock implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }

  if (alpacaized[currency.family]) {
    if (!currencyBridgeCache[currency.family]) {
      currencyBridgeCache[currency.family] = getAlpacaCurrencyBridge(currency.family, "local");
    }
    return currencyBridgeCache[currency.family];
  }

  if (currencyBridgeCache[currency.family]) return currencyBridgeCache[currency.family];

  const setup = await loadSetupForFamily(currency.family);
  if (!setup?.bridge) {
    throw new CurrencyNotSupported("no implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }
  bridgeCache[currency.family] ??= wrapAccountBridge(setup.bridge.accountBridge);
  currencyBridgeCache[currency.family] ??= setup.bridge.currencyBridge;
  return currencyBridgeCache[currency.family];
};

/**
 * Async: loads the account bridge, caching the result.
 */
export const getAccountBridge = async (
  account: AccountLike,
  parentAccount?: Account | null,
): Promise<AccountBridge<any>> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { currency } = mainAccount;
  const supportedError = checkAccountSupported(mainAccount);

  if (supportedError) {
    throw supportedError;
  }

  try {
    return await getAccountBridgeByFamily(currency.family, mainAccount.id);
  } catch {
    throw new CurrencyNotSupported("currency not supported " + currency.id, {
      currencyName: currency.id,
    });
  }
};

export async function getAccountBridgeByFamily(
  family: string,
  accountId?: string,
): Promise<AccountBridge<any>> {
  if (accountId) {
    const { type } = decodeAccountId(accountId);

    if (type === "mock") {
      const mockBridge = await loadMockBridgeForFamilyLazy(family);
      // TODO Remove once we delete mock bridges tests
      if (mockBridge) {
        if (typeof mockBridge.loadCoinConfig === "function") {
          mockBridge.loadCoinConfig();
        }
        return wrapAccountBridge(mockBridge.accountBridge);
      }
    }
  }

  if (alpacaized[family]) {
    if (!bridgeCache[family]) {
      bridgeCache[family] = wrapAccountBridge(getAlpacaAccountBridge(family, "local"));
    }
    return bridgeCache[family];
  }

  if (bridgeCache[family]) return bridgeCache[family];

  const setup = await loadSetupForFamily(family);
  if (!setup?.bridge) {
    throw new CurrencyNotSupported("account bridge not found " + family);
  }
  bridgeCache[family] = wrapAccountBridge(setup.bridge.accountBridge);
  currencyBridgeCache[family] ??= setup.bridge.currencyBridge;
  return bridgeCache[family];
}

function wrapAccountBridge<T extends TransactionCommon>(
  bridge: AccountBridge<T>,
): AccountBridge<T> {
  return {
    ...bridge,
    getTransactionStatus: async (...args) => {
      const blockchainTransactionStatus = await bridge.getTransactionStatus(...args);

      const account = args[0];
      if (!isCheckSanctionedAddressEnabled(account.currency)) {
        return blockchainTransactionStatus;
      }

      const commonTransactionStatus = await commonGetTransactionStatus(...args);
      return mergeResults(blockchainTransactionStatus, commonTransactionStatus);
    },
  };
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
