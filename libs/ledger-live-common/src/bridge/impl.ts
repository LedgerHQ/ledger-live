import {
  isAddressSanctioned,
  isCheckSanctionedAddressEnabled,
} from "@ledgerhq/coin-framework/sanction/index";
import { CurrencyNotSupported } from "@ledgerhq/errors";
import { decodeAccountId, getMainAccount } from "../account";
import { getEnv } from "@ledgerhq/live-env";
import { checkAccountSupported } from "../account/index";
import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
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
import { AddressesSanctionedError } from "@ledgerhq/coin-framework/sanction/errors";
// Removed: stores are now managed globally by @ledgerhq/cryptoassets/cal-client/store

const alpacaized = {
  evm: true,
  xrp: true,
  stellar: true,
  tezos: true,
};

// let accountBridgeInstance: AccountBridge<any> | null = null;
const bridgeCache: Record<string, AccountBridge<any>> = {};
const currencyBridgeCache: Record<string, CurrencyBridge> = {};

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  if (getEnv("MOCK")) {
    const mockBridge = mockBridges[currency.family];
    // TODO Remove once we delete mock bridges tests
    if (mockBridge) {
      if (typeof mockBridge.loadCoinConfig === "function") {
        mockBridge.loadCoinConfig();
      }
      return mockBridge.currencyBridge;
    }
    throw new CurrencyNotSupported("no mock implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }

  if (alpacaized[currency.family]) {
    if (!currencyBridgeCache[currency.family]) {
      currencyBridgeCache[currency.family] = getAlpacaCurrencyBridge(currency.family, "network");
    }
    return currencyBridgeCache[currency.family];
  }

  const jsBridge = jsBridges[currency.family];
  if (jsBridge) {
    return jsBridge.currencyBridge;
  }

  throw new CurrencyNotSupported("no implementation available for currency " + currency.id, {
    currencyName: currency.id,
  });
};

export const getAccountBridge = (
  account: AccountLike,
  parentAccount?: Account | null,
): AccountBridge<any> => {
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

export function getAccountBridgeByFamily(family: string, accountId?: string): AccountBridge<any> {
  if (accountId) {
    const { type } = decodeAccountId(accountId);

    if (type === "mock") {
      const mockBridge = mockBridges[family];
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
      bridgeCache[family] = wrapAccountBridge(getAlpacaAccountBridge(family, "network"));
    }
    return bridgeCache[family];
  }

  const jsBridge = jsBridges[family];
  if (!jsBridge) {
    throw new CurrencyNotSupported("account bridge not found " + family);
  }
  return wrapAccountBridge(jsBridge.accountBridge);
}

// Removed: setup() is no longer needed. The store is now managed globally by @ledgerhq/cryptoassets/cal-client/store.
// Use setupCalClientStore() or setupMockCryptoAssetsStore() from @ledgerhq/cryptoassets/cal-client/test-helpers instead.

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
