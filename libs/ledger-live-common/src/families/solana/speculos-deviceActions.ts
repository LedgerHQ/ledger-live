import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

function getMainCurrency(currency: CryptoCurrency) {
  if (currency.isTestnetFor !== undefined) {
    return getCryptoCurrencyById(currency.isTestnetFor);
  }
  return currency;
}

function ellipsis(str: string) {
  return `${str.slice(0, 7)}..${str.slice(-7)}`;
}

function formatAmount(c: CryptoCurrency, amount: number) {
  const currency = getMainCurrency(c);
  return formatDeviceAmount(currency, new BigNumber(amount), {
    postfixCode: true,
  });
}

export const acceptTransferTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Transfer",
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.BOTH,
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
      button: SpeculosButton.RIGHT,
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
      button: SpeculosButton.RIGHT,
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
      button: SpeculosButton.RIGHT,
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
      button: SpeculosButton.RIGHT,
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
      button: SpeculosButton.BOTH,
      final: true,
    },
  ],
});

export const acceptStakeDelegateTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Delegate from",
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.BOTH,
        final: true,
      },
    ],
  });

export const acceptStakeUndelegateTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Deactivate stake",
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.BOTH,
        final: true,
      },
    ],
  });

export const acceptStakeWithdrawTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Stake withdraw",
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.RIGHT,
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
        button: SpeculosButton.BOTH,
        final: true,
      },
    ],
  });

function throwUnexpectedTransaction(): never {
  throw new Error("unexpected or unprepared transaction");
}
