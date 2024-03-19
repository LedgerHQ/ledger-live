import expect from "expect";
import type { AppSpec } from "../../bot/types";
import type { CardanoAccount, CardanoOperationExtra, CardanoResources, Transaction } from "./types";
import { botTest, genericTestDestination, pickSiblings } from "../../bot/specs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { mergeTokens } from "./logic";
import { formatCurrencyUnit, parseCurrencyUnit } from "../../currencies";
import { SubAccount } from "@ledgerhq/types-live";
import { acceptTransaction } from "./speculos-deviceActions";

const maxAccounts = 5;
const currency = getCryptoCurrencyById("cardano");
const minBalanceRequired = parseCurrencyUnit(currency.units[0], "2.2");
const minBalanceRequiredForMaxSend = parseCurrencyUnit(currency.units[0], "1");
const minBalanceRequiredForDelegate = parseCurrencyUnit(currency.units[0], "3");
const minSpendableRequiredForTokenTx = parseCurrencyUnit(currency.units[0], "3");

const cardano: AppSpec<Transaction> = {
  name: "cardano",
  currency: getCryptoCurrencyById("cardano"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "CardanoADA",
    // FIXME latest app version requires to update cardano libs
    // https://ledgerhq.atlassian.net/browse/LIVE-5447
    appVersion: "5.0.0",
  },
  minViableAmount: minBalanceRequired,
  genericDeviceAction: acceptTransaction,
  testTimeout: 5 * 60 * 1000,
  mutations: [
    {
      testDestination: genericTestDestination,
      name: "move ~50%",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minBalanceRequired), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccounts);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const updates = [
          { recipient },
          {
            amount: new BigNumber(account.balance.dividedBy(2)).dp(0, BigNumber.ROUND_CEIL),
          },
          { memo: "LedgerLiveBot" },
        ];

        return {
          transaction,
          updates,
        };
      },
      test: ({ accountBeforeTransaction, operation, transaction }): void => {
        const cardanoResources = (accountBeforeTransaction as CardanoAccount)
          .cardanoResources as CardanoResources;

        const extra: CardanoOperationExtra = {
          memo: transaction.memo,
        };

        if (cardanoResources.delegation?.rewards.gt(0)) {
          extra.rewards = formatCurrencyUnit(
            accountBeforeTransaction.currency.units[0],
            new BigNumber(cardanoResources.delegation.rewards),
            {
              showCode: true,
              disableRounding: true,
            },
          );
        }

        botTest("operation extra matches memo", () => expect(operation.extra).toEqual(extra));

        botTest("optimistic value matches transaction amount", () =>
          expect(transaction.amount).toEqual(operation.value.minus(operation.fee)),
        );
      },
    },
    {
      name: "send max",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minBalanceRequiredForMaxSend), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccounts);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const updates = [{ recipient }, { useAllAmount: true }];

        return {
          transaction,
          updates,
        };
      },
      test: ({ account }): void => {
        const cardanoResources = (account as CardanoAccount).cardanoResources as CardanoResources;
        const utxoTokens = cardanoResources.utxos.map(u => u.tokens).flat();
        const tokenBalance = mergeTokens(utxoTokens);
        const requiredAdaForTokens = tokenBalance.length
          ? TyphonUtils.calculateMinUtxoAmount(
              tokenBalance,
              new BigNumber(cardanoResources.protocolParams.lovelacePerUtxoWord),
              false,
            )
          : new BigNumber(0);

        botTest("remaining balance equals requiredAdaForTokens)", () =>
          expect(account.balance).toEqual(requiredAdaForTokens),
        );
      },
    },
    {
      name: "move ~10% token",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gte(minSpendableRequiredForTokenTx), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccounts);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const subAccount = account.subAccounts?.find(subAccount =>
          subAccount.balance.gt(1),
        ) as SubAccount;
        invariant(subAccount, "No token account with balance");

        const updates = [
          { subAccountId: subAccount.id },
          { recipient },
          {
            amount: new BigNumber(subAccount.balance.dividedBy(10)).dp(0, BigNumber.ROUND_CEIL),
          },
        ];

        return {
          transaction,
          updates,
        };
      },
      test: ({ operation, transaction }): void => {
        botTest("subOperations is defined", () => expect(operation.subOperations).toBeTruthy());

        botTest("there's only one subOperation", () =>
          expect(operation.subOperations?.length).toEqual(1),
        );

        const subOperation = operation.subOperations && operation.subOperations[0];

        botTest("subOperation have correct tx amount", () =>
          expect(subOperation?.value).toEqual(transaction.amount),
        );
      },
    },
    {
      name: "delegate to pool",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gte(minBalanceRequiredForDelegate), "balance is too low");
        const transaction = bridge.createTransaction(account);
        return {
          transaction,
          updates: [
            {
              mode: "delegate",
              poolId: "7df262feae9201d1b2e32d4c825ca91b29fbafb2b8e556f6efb7f549",
            },
          ],
        };
      },
      test: ({ operation, transaction, accountBeforeTransaction }): void => {
        botTest("check delegate operation type", () => {
          expect(operation.type).toEqual("DELEGATE");
        });

        botTest("check operation value", () => {
          const cardanoResources = (accountBeforeTransaction as CardanoAccount).cardanoResources;
          const isStakeKeyRegistered = cardanoResources.delegation?.status ?? false;
          let opValue = transaction.fees as BigNumber;
          if (!isStakeKeyRegistered) {
            opValue = opValue.plus(cardanoResources.protocolParams.stakeKeyDeposit);
          }
          expect(operation.value.toString()).toEqual(opValue.toString());
        });
      },
    },
    {
      name: "redelegate to pool",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gte(minBalanceRequiredForDelegate), "balance is too low");
        invariant(
          (account as CardanoAccount).cardanoResources.delegation?.poolId,
          "account should already be delegated to redelegate",
        );
        const transaction = bridge.createTransaction(account);
        return {
          transaction,
          updates: [
            {
              mode: "delegate",
              poolId: "da50099e7aa1d926e1888990b1c404caf554dd6f68a1cb0322999d1d",
            },
          ],
        };
      },
      test: ({ operation, transaction }): void => {
        botTest("check delegate operation type", () => {
          expect(operation.type).toEqual("DELEGATE");
        });

        botTest("op value should be equal to fees", () => {
          expect(operation.value.toString()).toEqual(transaction.fees?.toString());
        });
      },
    },
    {
      name: "undelegate",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gte(minBalanceRequiredForDelegate), "balance is too low");
        invariant(
          (account as CardanoAccount).cardanoResources.delegation?.poolId,
          "account should already be delegated to undelegate",
        );
        const transaction = bridge.createTransaction(account);
        return {
          transaction,
          updates: [
            {
              mode: "undelegate",
            },
          ],
        };
      },
      test: ({ operation, transaction }): void => {
        botTest("check undelegate operation type", () => {
          expect(operation.type).toEqual("UNDELEGATE");
        });

        botTest("op value should be equal to fees", () => {
          expect(operation.value.toString()).toEqual(transaction.fees?.toString());
        });
      },
    },
  ],
};

export default { cardano };
