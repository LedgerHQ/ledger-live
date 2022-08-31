import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Transaction, NearAccount } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { acceptTransaction } from "./speculos-deviceActions";

const currency = getCryptoCurrencyById("near");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.00001");
const stakingFee = parseCurrencyUnit(currency.units[0], "0.002");
const maxAccount = 3;
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
    },
    {
      name: "Stake",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(
          maxSpendable.gt(minimalAmount.plus(stakingFee)),
          "balance is too low"
        );

        const amount = minimalAmount
          .times(10)
          .times(Math.random())
          .integerValue();

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "stake", recipient: validator }, { amount }],
        };
      },
    },
    {
      name: "Unstake",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(stakingFee), "balance is too low for fees");

        const { nearResources } = account as NearAccount;

        const staked = nearResources?.stakedBalance || new BigNumber(0);

        invariant(
          staked.gt(minimalAmount),
          "staked balance is too low for unstaking"
        );

        const halfStaked = staked.div(2);

        const amount = halfStaked.gt(minimalAmount)
          ? halfStaked.integerValue()
          : staked.integerValue();

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "unstake", recipient: validator }, { amount }],
        };
      },
    },
    {
      name: "Withdraw",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(stakingFee), "balance is too low for fees");

        const { nearResources } = account as NearAccount;

        const available = nearResources?.availableBalance || new BigNumber(0);

        invariant(
          available.gt(minimalAmount),
          "available balance is too low for withdrawing"
        );

        const halfAvailable = available.div(2);

        const amount = halfAvailable.gt(minimalAmount)
          ? halfAvailable.integerValue()
          : available.integerValue();

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "withdraw", recipient: validator }, { amount }],
        };
      },
    },
  ],
};

export default {
  near,
};
