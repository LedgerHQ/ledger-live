import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";
import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction } from "./types";

function getMainCurrency(currency: CryptoCurrency) {
  if (currency.isTestnetFor !== undefined) {
    return getCryptoCurrencyById(currency.isTestnetFor);
  }
  return currency;
}

function ellipsis(str: string) {
  return `${str.slice(0, 7)}..${str.slice(-7)}`;
}

function formatAmount(c: CryptoCurrency | TokenCurrency, amount: number) {
  const currency = c.type === "CryptoCurrency" ? getMainCurrency(c) : c;
  return formatDeviceAmount(currency, new BigNumber(amount), {
    postfixCode: true,
  });
}

function formatTokenAmount(c: TokenCurrency, amount: number) {
  return formatAmount(c, amount);
}

function findTokenAccount(account: Account, id: string) {
  const tokenAccount = findSubAccountById(account, id);
  if (!tokenAccount || tokenAccount.type !== "TokenAccount") {
    throw new Error("expected token account " + id);
  }
  return tokenAccount;
}

export const acceptTransferTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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

export const acceptStakeCreateAccountTransaction: DeviceAction<Transaction, any> = deviceActionFlow(
  {
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
              command.amount + command.stakeAccRentExemptAmount,
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
  },
);

export const acceptStakeDelegateTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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

export const acceptStakeUndelegateTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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

export const acceptStakeWithdrawTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
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

export const acceptTransferTokensTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Transfer tokens",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ account, transaction }) => {
        const command = transaction.model.commandDescriptor?.command;
        if (command?.kind === "token.transfer" && transaction.subAccountId) {
          const tokenCurrency = findTokenAccount(account, transaction.subAccountId).token;
          // transfer fee is added to amount for a tokens with tx fee extension
          // [solana/network/chain/web3.ts -> buildTokenTransferInstructions]
          const amount =
            command.extensions?.transferFee?.transferAmountIncludingFee || command.amount;
          return formatTokenAmount(tokenCurrency, amount);
        }
        throwUnexpectedTransaction();
      },
    },
    {
      title: "Mint",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        const command = transaction.model.commandDescriptor?.command;
        if (command?.kind === "token.transfer") {
          return ellipsis(command.mintAddress);
        }
        throwUnexpectedTransaction();
      },
    },
    {
      title: "From",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        const command = transaction.model.commandDescriptor?.command;
        if (command?.kind === "token.transfer") {
          return ellipsis(command.ownerAssociatedTokenAccountAddress);
        }
        throwUnexpectedTransaction();
      },
    },
    {
      title: "To",
      button: SpeculosButton.RIGHT,
      expectedValue: ({ transaction }) => {
        const command = transaction.model.commandDescriptor?.command;
        if (command?.kind === "token.transfer") {
          return ellipsis(command.recipientDescriptor.tokenAccAddress);
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

export const acceptTransferTokensWithATACreationTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Create token acct",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "token.transfer") {
            return ellipsis(command.recipientDescriptor.tokenAccAddress);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "From mint",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "token.transfer") {
            return ellipsis(command.mintAddress);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Owned by",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "token.transfer") {
            return ellipsis(command.recipientDescriptor.walletAddress);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Funded by",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "token.transfer") {
            return ellipsis(command.ownerAddress);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Transfer tokens",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "token.transfer" && transaction.subAccountId) {
            const tokenCurrency = findTokenAccount(account, transaction.subAccountId).token;
            // transfer fee is added to amount for a tokens with tx fee extension
            // [solana/network/chain/web3.ts -> buildTokenTransferInstructions]
            const amount =
              command.extensions?.transferFee?.transferAmountIncludingFee || command.amount;
            return formatTokenAmount(tokenCurrency, amount);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "Mint",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "token.transfer") {
            return ellipsis(command.mintAddress);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "From",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "token.transfer") {
            return ellipsis(command.ownerAssociatedTokenAccountAddress);
          }
          throwUnexpectedTransaction();
        },
      },
      {
        title: "To",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => {
          const command = transaction.model.commandDescriptor?.command;
          if (command?.kind === "token.transfer") {
            return ellipsis(command.recipientDescriptor.tokenAccAddress);
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
