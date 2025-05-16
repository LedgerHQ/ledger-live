import { BlacklistAddressLog, isAddressSanctioned, sendLog } from "../sanction";
import { CurrencyConfig } from "@ledgerhq/coin-framework/lib/config";
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
import { getCurrencyConfiguration, getSharedConfiguration } from "../config";
import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
import { RecipientAddressSanctionedError, UserAddressSanctionedError } from "../sanction/errors";

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
  const warnings = { ...blockchainSpecific.warnings, ...common.warnings };
  return { ...blockchainSpecific, errors, warnings };
}

async function commonGetTransactionStatus(
  account: Account,
  transaction: any,
): Promise<Partial<TransactionStatusCommon>> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!isCheckBlacklistAddressEnabled(account.currency)) {
    return Promise.resolve({ errors, warnings });
  }

  const payloadLog: BlacklistAddressLog = {
    user: account.freshAddress,
    amount: "0",
  };

  let recipientIsBlacklisted = false;
  if (transaction.recipient && transaction.recipient !== "") {
    recipientIsBlacklisted = await isAddressSanctioned(
      account.currency.ticker,
      transaction.recipient,
    );
    if (recipientIsBlacklisted) {
      errors.recipient = new RecipientAddressSanctionedError();
      payloadLog.recipient = transaction.recipient;
    }
  }

  const userIsBlacklisted = await isAddressSanctioned(
    account.currency.ticker,
    account.freshAddress,
  );
  if (userIsBlacklisted) {
    errors.user = new UserAddressSanctionedError();
  }

  if (userIsBlacklisted || recipientIsBlacklisted) {
    sendLog(payloadLog);
  }

  return Promise.resolve({ errors, warnings });
}

function isCheckBlacklistAddressEnabled(currency: CryptoCurrency): boolean {
  let checkBlacklistAddress = false;
  const currencyConfig = tryGetCurrencyConfig(currency);
  if (currencyConfig && "checkBlacklistAddress" in currencyConfig) {
    checkBlacklistAddress = currencyConfig.checkBlacklistAddress === true;
  } else {
    const sharedConfiguration = getSharedConfiguration();
    if ("checkBlacklistAddress" in sharedConfiguration) {
      checkBlacklistAddress = sharedConfiguration.checkBlacklistAddress === true;
    }
  }

  return checkBlacklistAddress;
}

function tryGetCurrencyConfig(currency: CryptoCurrency): CurrencyConfig | undefined {
  try {
    return getCurrencyConfiguration(currency);
  } catch (error) {
    return undefined;
  }
}
