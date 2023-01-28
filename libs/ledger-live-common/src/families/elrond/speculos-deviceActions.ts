import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";
import { decodeTokenAccountId } from "../../account";
import BigNumber from "bignumber.js";

export const acceptMoveBalanceTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, status }) => {
          return formatDeviceAmount(account.currency, status.amount, {
            postfixCode: true,
          });
        },
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(
            account.unit,
            transaction.fees || new BigNumber(50000),
            {
              showCode: true,
              disableRounding: true,
              joinFragmentsSeparator: " ",
            }
          ).replace(/\s+/g, " "),
      },
      {
        title: "Data",
        button: "Rr",
      },
      {
        title: "Sign",
        button: "LRlr",
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });

export const acceptDelegateTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(account.unit, transaction.amount, {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }).replace(/\s+/g, " "),
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(
            account.unit,
            transaction.fees || new BigNumber(50000),
            {
              showCode: true,
              disableRounding: true,
              joinFragmentsSeparator: " ",
            }
          ).replace(/\s+/g, " "),
      },
      {
        title: "Data",
        button: "Rr",
        expectedValue: () => "[Size:       8] delegate",
      },
      {
        title: "Sign",
        button: "LRlr",
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });

export const acceptUndelegateTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account }) =>
          formatCurrencyUnit(account.unit, new BigNumber(0), {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }).replace(/\s+/g, " "),
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(
            account.unit,
            transaction.fees || new BigNumber(50000),
            {
              showCode: true,
              disableRounding: true,
              joinFragmentsSeparator: " ",
            }
          ).replace(/\s+/g, " "),
      },
      {
        title: "Data",
        button: "Rr",
      },
      {
        title: "Sign",
        button: "LRlr",
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });

export const acceptWithdrawTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account }) =>
          formatCurrencyUnit(account.unit, new BigNumber(0), {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }).replace(/\s+/g, " "),
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(
            account.unit,
            transaction.fees || new BigNumber(50000),
            {
              showCode: true,
              disableRounding: true,
              joinFragmentsSeparator: " ",
            }
          ).replace(/\s+/g, " "),
      },
      {
        title: "Data",
        button: "Rr",
      },
      {
        title: "Sign",
        button: "LRlr",
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });

export const acceptEsdtTransferTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Token",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const { subAccounts } = account;
          const { subAccountId } = transaction;
          const tokenAccount = !subAccountId
            ? null
            : subAccounts && subAccounts.find((ta) => ta.id === subAccountId);

          if (!tokenAccount) {
            throw new Error();
          }

          const { token } = decodeTokenAccountId(tokenAccount.id);

          return token?.name ?? "";
        },
      },
      {
        title: "Value",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const { subAccounts } = account;
          const { subAccountId } = transaction;
          const tokenAccount = !subAccountId
            ? null
            : subAccounts && subAccounts.find((ta) => ta.id === subAccountId);

          if (!tokenAccount) {
            throw new Error();
          }

          const { token } = decodeTokenAccountId(tokenAccount.id);
          if (!token) {
            throw new Error();
          }

          return formatCurrencyUnit(token.units[0], transaction.amount, {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }).replace(/\s+/g, " ");
        },
      },
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(
            account.unit,
            transaction.fees || new BigNumber(50000),
            {
              showCode: true,
              disableRounding: true,
              joinFragmentsSeparator: " ",
            }
          ).replace(/\s+/g, " "),
      },
      {
        title: "Confirm transfer",
        button: "LRlr",
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });
export default {
  acceptMoveBalanceTransaction,
  acceptEsdtTransferTransaction,
  acceptDelegateTransaction,
  acceptUndelegateTransaction,
  acceptWithdrawTransaction,
};
