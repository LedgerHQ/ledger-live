import BigNumber from "bignumber.js";
import invariant from "invariant";
import type {
  AppSpec,
  TransactionArg,
  TransactionRes,
  TransactionTestInput,
  SpeculosTransport,
} from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";
import { pickSiblings, botTest, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import speculosDeviceActions from "./bot-deviceActions";

const MIN_VET_TRANSACTION_AMOUNT = 1000000000000000000;
const MAX_VTHO_FEE_FOR_VTHO_TRANSACTION = 1040000000000000000;
const MAX_VTHO_FEE_FOR_VET_TRANSACTION = 420000000000000000;

const vechainTest = {
  currency: getCryptoCurrencyById("vechain"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "VeChain",
    appVersion: "1.1.1",
  },
  allowEmptyAccounts: true,
  testTimeout: 60 * 1000, // 1 minute
  genericDeviceAction: speculosDeviceActions.acceptTransaction,
  onSpeculosDeviceCreated: async ({ transport }: { transport: SpeculosTransport }) => {
    // enable contract data
    await transport.button(SpeculosButton.RIGHT);
    await transport.button(SpeculosButton.BOTH);
    await transport.button(SpeculosButton.BOTH);
    await transport.button(SpeculosButton.RIGHT);
    await transport.button(SpeculosButton.BOTH);
    // enable multi-clause
    await transport.button(SpeculosButton.RIGHT);
    await transport.button(SpeculosButton.BOTH);
    await transport.button(SpeculosButton.RIGHT);
    await transport.button(SpeculosButton.BOTH);
    await transport.button(SpeculosButton.RIGHT);
    await transport.button(SpeculosButton.BOTH);
  },
};

const vet: AppSpec<Transaction> = {
  name: "VeChain VET",
  ...vechainTest,
  mutations: [
    {
      name: "move ~50% VET",
      feature: "send",
      maxRun: 1,
      transaction: ({
        account,
        siblings,
        bridge,
        maxSpendable,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        if (!account.subAccounts?.[0]) throw new Error("no VTHO account");
        invariant(account.balance.gt(MIN_VET_TRANSACTION_AMOUNT), "Vechain: VET balance is empty");
        invariant(
          account.subAccounts[0].balance.gt(MAX_VTHO_FEE_FOR_VET_TRANSACTION),
          "Vechain: VTHO balance is not enough",
        );
        const sibling = pickSiblings(siblings, 2);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);
        const amount = maxSpendable.div(2).integerValue();
        const updates = [{ amount }, { recipient }];
        return {
          transaction,
          updates,
        };
      },
      test: ({
        account,
        accountBeforeTransaction,
        operation,
      }: TransactionTestInput<Transaction>): void | undefined => {
        botTest("account balance decreased with operation value", () =>
          expect(account.balance.toString()).toBe(
            accountBeforeTransaction.balance.minus(operation.value).toString(),
          ),
        );
      },
    },
    {
      name: "move all VET",
      feature: "sendMax",
      maxRun: 1,
      transaction: ({
        account,
        siblings,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        if (!account.subAccounts?.[0]) throw new Error("no VTHO account");
        invariant(account.balance.gt(MIN_VET_TRANSACTION_AMOUNT), "Vechain: VET balance is empty");
        invariant(
          account.subAccounts?.[0].balance.gt(MAX_VTHO_FEE_FOR_VET_TRANSACTION),
          "Vechain: VTHO balance is not enough",
        );
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);
        const updates = [{ useAllAmount: true }, { recipient }];
        return {
          transaction,
          updates,
        };
      },
      test: ({ account }: TransactionTestInput<Transaction>): void | undefined => {
        botTest("account balance decreased with operation value", () =>
          expect(account.balance.toString()).toBe(new BigNumber(0).toString()),
        );
      },
    },
  ],
};

const vtho: AppSpec<Transaction> = {
  name: "VeChain VTHO",
  ...vechainTest,
  skipOperationHistory: true,
  mutations: [
    {
      name: "move ~50% VTHO",
      feature: "tokens",
      maxRun: 1,
      transaction: ({
        account,
        siblings,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        if (!account.subAccounts?.[0]) throw new Error("no VTHO account");
        invariant(
          account.subAccounts?.[0].balance.gt(MAX_VTHO_FEE_FOR_VTHO_TRANSACTION * 2),
          "Vechain: VTHO balance is not enough",
        );
        const sibling = pickSiblings(siblings, 2);
        const recipient = sibling.freshAddress;
        if (
          !account.subAccounts ||
          !account.subAccounts[0] ||
          !(account.subAccounts[0].type == "TokenAccount")
        )
          throw new Error("no VTHO account");
        const tokenAccount = account.subAccounts[0];
        const transaction = bridge.createTransaction(tokenAccount);
        const amount = tokenAccount.balance.div(2).integerValue();
        const updates = [{ amount }, { recipient }, { subAccountId: tokenAccount.id }];

        return {
          transaction,
          updates,
        };
      },
      test: ({
        account,
        accountBeforeTransaction,
      }: TransactionTestInput<Transaction>): void | undefined => {
        botTest("account balance decreased with operation value", () =>
          expect(account?.subAccounts?.[0].balance.toString()).toBe(
            new BigNumber(accountBeforeTransaction?.subAccounts?.[0].balance || 0)
              .div(2)
              .toString(),
          ),
        );
      },
    },
    {
      name: "move all VTHO",
      feature: "tokens",
      maxRun: 1,
      transaction: ({
        account,
        siblings,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        if (!account.subAccounts?.[0]) throw new Error("no VTHO account");
        invariant(
          account.subAccounts?.[0].balance.gt(MAX_VTHO_FEE_FOR_VTHO_TRANSACTION),
          "Vechain: VTHO balance is not enough",
        );
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        if (
          !account.subAccounts ||
          !account.subAccounts[0] ||
          !(account.subAccounts[0].type == "TokenAccount")
        )
          throw new Error("no VTHO account");
        const transaction = bridge.createTransaction(account);
        const updates = [
          { useAllAmount: true },
          { recipient },
          { subAccountId: account.subAccounts[0].id },
        ];
        return {
          transaction,
          updates,
        };
      },
      test: ({ account }: TransactionTestInput<Transaction>): void | undefined => {
        botTest("account balance decreased with operation value", () =>
          expect(account?.subAccounts?.[0].balance.toString()).toBe(new BigNumber(0).toString()),
        );
      },
    },
  ],
};

export default { vtho, vet };
