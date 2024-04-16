import invariant from "invariant";
import expect from "expect";
import { BigNumber } from "bignumber.js";
import type { Transaction, NearAccount } from "./types";
import {
  getCryptoCurrencyById,
  parseCurrencyUnit,
} from "@ledgerhq/coin-framework/currencies/index";
import { botTest, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { acceptTransaction } from "./speculos-deviceActions";

const currency = getCryptoCurrencyById("near");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.00001");
const stakingFee = parseCurrencyUnit(currency.units[0], "0.002");
const maxAccount = 8;
const validator = "ledgerbyfigment.poolv1.near";

const near: AppSpec<Transaction> = {
  name: "NEAR",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "NEAR",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  mutations: [
    {
      name: "Move 50% to another account",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalAmount), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient }, { amount }],
        };
      },
      test: ({ accountBeforeTransaction, operation, account }) => {
        botTest("account spendable balance decreased with operation", () =>
          expect(account.spendableBalance).toEqual(
            accountBeforeTransaction.spendableBalance.minus(operation.value),
          ),
        );
      },
    },
    {
      name: "Send max to another account",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalAmount), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient }, { useAllAmount: true }],
        };
      },
      test: ({ account }) => {
        botTest("account spendable balance is zero", () =>
          expect(account.spendableBalance.toString()).toBe("0"),
        );
      },
    },
    {
      name: "Stake",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalAmount.plus(stakingFee)), "balance is too low");

        const amount = minimalAmount.times(10).times(Math.random()).integerValue();

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "stake", recipient: validator }, { amount }],
        };
      },
      test: ({ accountBeforeTransaction, operation, account }) => {
        const { nearResources } = account as NearAccount;
        const { nearResources: beforeTransactionNearResources } =
          accountBeforeTransaction as NearAccount;

        // Sometimes, 1 yoctoNEAR gets deducted from the staked amount, so we assert against a range.
        botTest("account staked balance increased with operation", () => {
          expect(
            nearResources.stakedBalance.gte(
              beforeTransactionNearResources.stakedBalance.plus(operation.value.minus("1")),
            ),
          ).toBe(true);
          expect(
            nearResources.stakedBalance.lte(
              beforeTransactionNearResources.stakedBalance.plus(operation.value),
            ),
          ).toBe(true);
        });
      },
    },
    {
      name: "Unstake",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(stakingFee), "balance is too low for fees");

        const { nearResources } = account as NearAccount;

        const staked = nearResources?.stakedBalance || new BigNumber(0);

        invariant(staked.gt(minimalAmount), "staked balance is too low for unstaking");

        const halfStaked = staked.div(2);

        const amount = halfStaked.gt(minimalAmount)
          ? halfStaked.integerValue()
          : staked.integerValue();

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "unstake", recipient: validator }, { amount }],
        };
      },
      test: ({ accountBeforeTransaction, account }) => {
        const { nearResources } = account as NearAccount;
        const { nearResources: beforeTransactionNearResources } =
          accountBeforeTransaction as NearAccount;

        botTest("account pending balance increased", () =>
          expect(
            nearResources.pendingBalance.gt(beforeTransactionNearResources.pendingBalance),
          ).toBe(true),
        );
      },
    },
    {
      name: "Withdraw",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(stakingFee), "balance is too low for fees");

        const { nearResources } = account as NearAccount;

        const available = nearResources?.availableBalance || new BigNumber(0);

        invariant(available.gt(minimalAmount), "available balance is too low for withdrawing");

        const halfAvailable = available.div(2);

        const amount = halfAvailable.gt(minimalAmount)
          ? halfAvailable.integerValue()
          : available.integerValue();

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "withdraw", recipient: validator }, { amount }],
        };
      },
      test: ({ accountBeforeTransaction, account }) => {
        const { nearResources } = account as NearAccount;
        const { nearResources: beforeTransactionNearResources } =
          accountBeforeTransaction as NearAccount;

        botTest("account withdrawable balance decreased", () =>
          expect(
            nearResources.availableBalance.lt(beforeTransactionNearResources.availableBalance),
          ).toBe(true),
        );
      },
    },
  ],
};

export default {
  near,
};
