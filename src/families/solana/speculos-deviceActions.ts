import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";
import { CryptoCurrency, getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";

function getMainCurrency(currency: CryptoCurrency) {
  if (currency.isTestnetFor !== undefined) {
    return getCryptoCurrencyById(currency.isTestnetFor);
  }
  return currency;
}

function ellipsis(str: string) {
  return `${str.slice(0, 7)}..${str.slice(-7)}`;
}

function formatAmount(currency: CryptoCurrency, amount: number) {
  const unit = getMainCurrency(currency).units[0];
  return formatCurrencyUnit(unit, new BigNumber(amount), {
    disableRounding: true,
    showCode: true,
  }).replace(/\s/g, " ");
}

export const acceptTransferTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Transfer",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "transfer") {
            return formatAmount(account.currency, command.amount);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Recipient",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "transfer") {
            return ellipsis(command.recipient);
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

export const acceptStakeCreateAccountTransaction: DeviceAction<
  Transaction,
  any
> = deviceActionFlow({
  steps: [
    {
      title: "Delegate from",
      button: "Rr",
      expectedValue: ({ transaction }) => {
        const command = transaction.model.commandDescriptor?.command;
        if (command?.kind === "stake.createAccount") {
          return ellipsis(command.stakeAccAddress);
        }

        throwUnexpectedTransaction();
      },
    },
    {
      title: "Deposit",
      button: "Rr",
      expectedValue: ({ account, transaction }) => {
        const command = transaction.model.commandDescriptor?.command;
        if (command?.kind === "stake.createAccount") {
          return formatAmount(
            account.currency,
            command.amount + command.stakeAccRentExemptAmount
          );
        }

        throwUnexpectedTransaction();
      },
    },
    {
      title: "New authority",
      button: "Rr",
      expectedValue: ({ transaction }) => {
        const command = transaction.model.commandDescriptor?.command;
        if (command?.kind === "stake.createAccount") {
          return ellipsis(command.fromAccAddress);
        }

        throwUnexpectedTransaction();
      },
    },
    {
      title: "Vote account",
      button: "Rr",
      expectedValue: ({ transaction }) => {
        const command = transaction.model.commandDescriptor?.command;
        if (command?.kind === "stake.createAccount") {
          return ellipsis(command.delegate.voteAccAddress);
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

export const acceptStakeDelegateTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Delegate from",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "stake.delegate") {
            return ellipsis(command.stakeAccAddr);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Vote account",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "stake.delegate") {
            return ellipsis(command.voteAccAddr);
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

export const acceptStakeUndelegateTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Deactivate stake",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "stake.undelegate") {
            return ellipsis(command.stakeAccAddr);
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

export const acceptStakeWithdrawTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Stake withdraw",
        button: "Rr",
        expectedValue: ({ account, transaction }) => {
          const command = transaction.model.commandDescriptor?.command;

          if (command?.kind === "stake.withdraw") {
            return formatAmount(account.currency, command.amount);
          }

          throwUnexpectedTransaction();
        },
      },
      {
        title: "From",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;

          if (command?.kind === "stake.withdraw") {
            return ellipsis(command.stakeAccAddr);
          }

          throwUnexpectedTransaction();
        },
      },
      {
        title: "To",
        button: "Rr",
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;

          if (command?.kind === "stake.withdraw") {
            return ellipsis(command.toAccAddr);
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
  acceptTransferTransaction,
  acceptStakeCreateAccountTransaction,
};
