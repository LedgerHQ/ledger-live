import { isAddressSanctioned } from "../sanction";
import { CurrencyNotSupported } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastArg,
  CurrencyBridge,
  OperationType,
} from "@ledgerhq/types-live";
import { decodeAccountId, getMainAccount } from "../account";
import { checkAccountSupported } from "../account/index";
import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
import { getAlpacaCurrencyBridge } from "./generic-alpaca/currencyBridge";
import { getAlpacaAccountBridge } from "./generic-alpaca/accountBridge";
import { TransactionCommon } from "@ledgerhq/types-live";

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
      await commonBroadcast(...args);
      return await bridge.broadcast(...args);
    },
    // getTransactionStatus: async (...args) => {
    //   const blockchainSpecific = await bridge.getTransactionStatus(...args);
    //   const common = await commonGetTransactionStatus(...args);
    //   const merged = mergeResults(blockchainSpecific, common);
    //   return merged;
    // },
  };
}

// function mergeResults(
//   blockchainSpecific: TransactionStatusCommon,
//   common: Partial<TransactionStatusCommon>,
// ): TransactionStatusCommon {
//   const errors = { ...blockchainSpecific.errors, ...common.errors };
//   const warnings = { ...blockchainSpecific.warnings, ...common.warnings };
//   return { ...blockchainSpecific, errors, warnings };
// }

// async function commonGetTransactionStatus(
//   account: Account,
//   transaction: TransactionCommon,
// ): Promise<Partial<TransactionStatusCommon>> {
//   const errors: Record<string, Error> = {};
//   const warnings: Record<string, Error> = {};

//   let recipientIsBlacklisted = false;
//   if (transaction.recipient && transaction.recipient !== "") {
//     recipientIsBlacklisted = await isAddressSanctioned(account.currency, transaction.recipient);
//     if (recipientIsBlacklisted) {
//       errors.recipient = new RecipientAddressSanctionedError();
//     }
//   }

//   const userIsBlacklisted = await isAddressSanctioned(account.currency, account.freshAddress);
//   if (userIsBlacklisted) {
//     errors.amount = new UserAddressSanctionedError();
//   }

//   if (userIsBlacklisted || recipientIsBlacklisted) {
//     // Send log
//     const url = "https://logs.ledger-test.com/";
//     const payload = {
//       ddsource: "LedgerLive",
//       ddtags: "env:stagging,service:swap,bu:wallet-services",
//       message: "transaction banned",
//       status: "warn",
//       hostname: "proxy",
//       service: "LedgerLive",
//       additionalProperties: {
//         AddressFrom: account.freshAddress,
//         AddressTo: transaction.recipient,
//         amount: transaction.amount.toString(),
//         currency: account.currency.ticker,
//         transactionType: "type", // TODO
//         timestamp: new Date().toUTCString(),
//       },
//     };

//     try {
//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });
//       const data = await response.text(); // or response.json() if you expect JSON
//       console.log("Response:", data);
//     } catch (error) {
//       console.error("Error sending log:", error);
//     }
//   }

//   return { errors, warnings };
// }

async function commonBroadcast({ account, signedOperation }: BroadcastArg<Account>): Promise<void> {
  const operation = signedOperation.operation;
  if (!operation?.recipients?.length) return;

  const recipient = operation.recipients[0];

  const recipientIsBlacklisted = await isAddressSanctioned(account.currency, recipient);
  const userIsBlacklisted = await isAddressSanctioned(account.currency, account.freshAddress);

  if (userIsBlacklisted || recipientIsBlacklisted) {
    // Send log
    const url = "https://logs.ledger-test.com/";
    const payload = {
      ddsource: "LedgerLive",
      ddtags: "env:stagging,service:swap,bu:wallet-services",
      message: "transaction banned",
      status: "warn",
      hostname: "proxy",
      service: "LedgerLive",
      additionalProperties: {
        AddressFrom: account.freshAddress,
        AddressTo: recipient,
        amount: operation.value.toString(),
        currency: account.currency.ticker,
        transactionType: mapToOperationCategory(operation.type),
        timestamp: new Date().toUTCString(),
      },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.text(); // or response.json() if you expect JSON
      console.log("Response:", data);
    } catch (error) {
      console.error("Error sending log:", error);
    }
  }
}

type OFACTransactionType = "Send" | "Receive" | "Swap" | "Earn" | undefined;

function mapToOperationCategory(type: OperationType): OFACTransactionType {
  if (!type) return undefined;
  const receiveTypes: OperationType[] = ["IN", "NFT_IN"];
  const sendTypes: OperationType[] = [
    "OUT",
    "NFT_OUT",
    "BURN",
    "FEES",
    "APPROVE",
    "OPT_OUT",
    "REVEAL",
    "CREATE",
  ];
  const swapTypes: OperationType[] = ["NONE", "UNKNOWN"];
  const earnTypes: OperationType[] = [
    "DELEGATE",
    "UNDELEGATE",
    "REDELEGATE",
    "REWARD",
    "FREEZE",
    "UNFREEZE",
    "WITHDRAW_EXPIRE_UNFREEZE",
    "UNDELEGATE_RESOURCE",
    "LEGACY_UNFREEZE",
    "VOTE",
    "REWARD_PAYOUT",
    "BOND",
    "UNBOND",
    "WITHDRAW_UNBONDED",
    "SET_CONTROLLER",
    "SLASH",
    "NOMINATE",
    "CHILL",
    "OPT_IN",
    "LOCK",
    "UNLOCK",
    "WITHDRAW",
    "REVOKE",
    "ACTIVATE",
    "REGISTER",
    "STAKE",
    "UNSTAKE",
    "WITHDRAW_UNSTAKED",
  ];

  if (receiveTypes.includes(type)) return "Receive";
  if (sendTypes.includes(type)) return "Send";
  if (swapTypes.includes(type)) return "Swap";
  if (earnTypes.includes(type)) return "Earn";

  return undefined;
}
