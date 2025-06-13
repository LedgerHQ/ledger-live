import { isAddressSanctioned } from "../sanction";
import { CurrencyNotSupported } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  Account,
  AccountBridge,
  AccountLike,
  CurrencyBridge,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import { decodeAccountId, getMainAccount } from "../account";
import { checkAccountSupported } from "../account/index";
import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
import { RecipientAddressSanctionedError, UserAddressSanctionedError } from "../sanction/errors";
import { getAlpacaCurrencyBridge } from "./generic-alpaca/currencyBridge";
import { getAlpacaAccountBridge } from "./generic-alpaca/accountBridge";
import { TransactionCommon } from "@ledgerhq/types-live";

const alpacaized = {
  xrp: true,
  stellar: true,
};

let accountBridgeInstance: AccountBridge<any> | null = null;
let currencyBridgeInstance: CurrencyBridge | null = null;

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  // console.log("getCurrencyBridge", currency.id, currency.family);
  if (getEnv("MOCK")) {
    const mockBridge = mockBridges[currency.family];
    if (mockBridge) return mockBridge.currencyBridge;
    throw new CurrencyNotSupported("no mock implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }

  if (alpacaized[currency.family]) {
    // console.log("getAlpacaCurrencyBridge", currency.family);
    // if (!currencyBridgeInstance) {
    //   console.log("Creating new Alpaca currency bridge instance for", currency.family);
    //   currencyBridgeInstance = getAlpacaCurrencyBridge(currency.family, "local");
    // }
    return getAlpacaCurrencyBridge(currency.family, "local");
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
  // console.log("getAccountBridge", account);
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
  // console.log("getAccountBridgeByFamily", family);
  if (accountId) {
    const { type } = decodeAccountId(accountId);

    if (type === "mock") {
      const mockBridge = mockBridges[family];
      if (mockBridge) return mockBridge.accountBridge;
    }
  }

  if (alpacaized[family]) {
    // if (!accountBridgeInstance) {
    //   accountBridgeInstance = getAlpacaAccountBridge(family, "local");
    // }
    return getAlpacaAccountBridge(family, "local");
  }

  const jsBridge = jsBridges[family];
  if (!jsBridge) {
    throw new CurrencyNotSupported("account currency bridge not found " + family);
  }
  return wrapAccountBridge(jsBridge.accountBridge);
}

function wrapAccountBridge<T extends TransactionCommon>(
  bridge: AccountBridge<T>,
): AccountBridge<T> {
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
  const warnings = { ...blockchainSpecific.warnings, ...common.warnings };
  return { ...blockchainSpecific, errors, warnings };
}

async function commonGetTransactionStatus(
  account: Account,
  transaction: TransactionCommon,
): Promise<Partial<TransactionStatusCommon>> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  let recipientIsBlacklisted = false;
  if (transaction.recipient && transaction.recipient !== "") {
    recipientIsBlacklisted = await isAddressSanctioned(account.currency, transaction.recipient);
    if (recipientIsBlacklisted) {
      errors.recipient = new RecipientAddressSanctionedError();
    }
  }

  const userIsBlacklisted = await isAddressSanctioned(account.currency, account.freshAddress);
  if (userIsBlacklisted) {
    errors.amount = new UserAddressSanctionedError();
  }

  if (userIsBlacklisted || recipientIsBlacklisted) {
    // Send log
  }

  return { errors, warnings };
}
