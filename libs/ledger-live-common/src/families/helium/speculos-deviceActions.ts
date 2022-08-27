import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

function getMainCurrency(currency: CryptoCurrency) {
  if (currency.isTestnetFor !== undefined) {
    return getCryptoCurrencyById(currency.isTestnetFor);
  }
  return currency;
}

function formatAmount(currency: CryptoCurrency, amount: number) {
  const unit = getMainCurrency(currency).units[0];
  const formattedNum = formatCurrencyUnit(unit, new BigNumber(amount), {
    disableRounding: true,
    showCode: false,
    useGrouping: false,
  }).replace(/\s/g, " ");

  return formattedNum;
}

export const acceptSendTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Wallet 0 (1/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return account.freshAddress.slice(0, 12);
          }
          throwUnexpectedTransaction();
        },
        maxY: 25,
      },
      {
        title: "Wallet 0 (2/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return account.freshAddress.slice(12, 24);
          }
          throwUnexpectedTransaction();
        },
        maxY: 25,
      },
      {
        title: "Wallet 0 (3/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return account.freshAddress.slice(24, 36);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Wallet 0 (4/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return account.freshAddress.slice(36, 48);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Wallet 0 (5/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return account.freshAddress.slice(48, account.freshAddress.length);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return formatAmount(account.currency, command.amount.toNumber());
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (1/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return command.recipient.slice(0, 12);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (2/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return command.recipient.slice(12, 24);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (3/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return command.recipient.slice(24, 36);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (4/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return command.recipient.slice(36, 48);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (5/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return command.recipient.slice(48, command.recipient.length);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Memo",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return "AmemAAAAAAA=";
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "DC Fee",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return new BigNumber(35000).toString();
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Approve",
        button: "LRlr",
        final: true,
      },
    ],
  });

export const acceptBurnTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Wallet 0 (1/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return account.freshAddress.slice(0, 12);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Wallet 0 (2/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return account.freshAddress.slice(12, 24);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Wallet 0 (3/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return account.freshAddress.slice(24, 36);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Wallet 0 (4/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return account.freshAddress.slice(36, 48);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Wallet 0 (5/5)",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return account.freshAddress.slice(48, account.freshAddress.length);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Burn TNT",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return formatAmount(account.currency, command.amount.toNumber());
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (1/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return command.recipient.slice(0, 12);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (2/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return command.recipient.slice(12, 24);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (3/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return command.recipient.slice(24, 36);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (4/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return command.recipient.slice(36, 48);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient (5/5)",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "burn") {
            return command.recipient.slice(48, command.recipient.length);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Memo",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return command.model.memo || "";
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "DC Fee",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction;
          if (command?.model.mode === "send") {
            return new BigNumber(35000).toString();
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Approve",
        button: "LRlr",
        final: true,
      },
    ],
  });

function throwUnexpectedTransaction(): never {
  throw new Error("unexpected or unprepared transaction");
}

export default {
  acceptSendTransaction,
  acceptBurnTransaction,
};
