import {
  isAddressSanctioned,
  isCheckSanctionedAddressEnabled,
  reportSanctionedTransaction,
} from "@ledgerhq/coin-framework/sanction/index";
import { CurrencyNotSupported } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import { decodeAccountId, getMainAccount } from "../account";
import { checkAccountSupported } from "../account/index";
import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
import { AddressesSanctionedError } from "@ledgerhq/coin-framework/sanction/errors";
import { getAlpacaCurrencyBridge } from "./generic-alpaca/currencyBridge";
import { getAlpacaAccountBridge } from "./generic-alpaca/accountBridge";
import { TransactionCommon } from "@ledgerhq/types-live";
import { t as translate } from "i18next";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";

const alpacaized = {
  xrp: true,
};

let accountBridgeInstance: AccountBridge<any> | null = null;
let currencyBridgeInstance: CurrencyBridge | null = null;

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  if (getEnv("MOCK")) {
    const mockBridge = mockBridges[currency.family];
    if (mockBridge) return mockBridge.currencyBridge;
    throw new CurrencyNotSupported("no mock implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }

  if (alpacaized[currency.family]) {
    if (!currencyBridgeInstance) {
      currencyBridgeInstance = getAlpacaCurrencyBridge(currency.family, "local");
    }
    return currencyBridgeInstance;
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

  if (alpacaized[family]) {
    if (!accountBridgeInstance) {
      accountBridgeInstance = getAlpacaAccountBridge(family, "local");
    }
    return accountBridgeInstance;
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
    broadcast: async (...args) => {
      const account = args[0].account;
      if (account.type === "Account") {
        if (!isCheckSanctionedAddressEnabled(account.currency)) {
          return bridge.broadcast(...args);
        }

        const sanctionedAddresses: string[] = [];
        const signedOperation = args[0].signedOperation;

        for (const sender of signedOperation.operation.senders) {
          const senderIsSanctioned = await isAddressSanctioned(account.currency, sender);
          if (senderIsSanctioned) {
            sanctionedAddresses.push(sender);
          }
        }

        const operation = args[0].signedOperation.operation;
        const recipients = operation.recipients;
        for (const recipient of recipients) {
          const recipientSanctioned = await isAddressSanctioned(account.currency, recipient);
          if (recipientSanctioned) {
            sanctionedAddresses.push(recipient);
          }
        }

        if (sanctionedAddresses.length > 0) {
          reportSanctionedTransaction({
            addressFrom: account.freshAddress,
            addressTo: operation.recipients.join(", "),
            amount: operation.value.toString(),
            currency: account.currency.ticker,
            transactionType: operation.type,
            sanctionedAddresses: sanctionedAddresses.join(", "),
          });
          throw new AddressesSanctionedError(...sanctionedAddresses);
        }
      }

      return await bridge.broadcast(...args);
    },
  };
}
