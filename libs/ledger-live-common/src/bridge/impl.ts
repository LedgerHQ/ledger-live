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
  TransactionStatusCommon,
} from "@ledgerhq/types-live";

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  if (getEnv("MOCK")) {
    const mockBridge = mockBridges[currency.family];
    if (mockBridge) return mockBridge.currencyBridge;
    throw new CurrencyNotSupported("no mock implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
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
      if (mockBridge) return mockBridge.accountBridge;
    }
  }

  const jsBridge = jsBridges[family];
  if (!jsBridge) {
    throw new CurrencyNotSupported("currency bridge not found " + family);
  }
  return wrapAccountBridge(jsBridge.accountBridge);
}

function wrapAccountBridge(bridge: AccountBridge<any>): AccountBridge<any> {
  return {
    ...bridge,
    getTransactionStatus: async (...args) => {
      const blockchainSpecific = await bridge.getTransactionStatus(...args);
      const common = await commonGetTransactionStatus(...args);
      const merged = mergeResults(blockchainSpecific, common);
      return merged;
    },
  };
}

function mergeResults(
  blockchainSpecific: TransactionStatusCommon,
  common: Partial<TransactionStatusCommon>,
): TransactionStatusCommon {
  const errors = { ...blockchainSpecific.errors, ...common.errors };
  const warnings = { ...blockchainSpecific.errors, ...common.warnings };
  return { ...blockchainSpecific, errors, warnings };
}

async function commonGetTransactionStatus(
  account: Account,
  transaction: any,
): Promise<Partial<TransactionStatusCommon>> {
  const errors: any = {};
  const warnings: any = {};
  // HERE WE IMPLEMENT BACKEND ADDRESS FETCH
  if (isAddressBlacklisted(account.currency.id, transaction.recipient)) {
    errors.recipient = new Error("Recipient address is blacklisted");
  }
  if (isAddressBlacklisted(account.currency.id, account.freshAddress)) {
    errors.amount = new Error("User is blacklisted");
  }
  return Promise.resolve({ errors, warnings });
}

function isAddressBlacklisted(currencyId: string, address: string) {
  return ["MY_ADDRESS_FOR_TESTING"].includes(address);
}
