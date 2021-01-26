// @flow
import expect from "expect";
import invariant from "invariant";

import sampleSize from "lodash/sampleSize";
import { BigNumber } from "bignumber.js";
import { getCurrentPolkadotPreloadData } from "../../families/polkadot/preload";
import { isAccountEmpty } from "../../account";
import type { Transaction } from "../../families/polkadot/types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { toOperationRaw } from "../../account";
import {
  canBond,
  canUnbond,
  canNominate,
  isFirstBond,
} from "../../families/polkadot/logic";

const currency = getCryptoCurrencyById("polkadot");

const POLKADOT_MIN_SAFE = parseCurrencyUnit(currency.units[0], "0.05");
const EXISTENTIAL_DEPOSIT = parseCurrencyUnit(currency.units[0], "1.0");

const polkadot: AppSpec<Transaction> = {
  name: "Polkadot",
  currency: getCryptoCurrencyById("polkadot"),
  appQuery: {
    model: "nanoS",
    appName: "Polkadot",
  },
  testTimeout: 2 * 60 * 1000,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(POLKADOT_MIN_SAFE), "balance is too low");
  },
  test: ({ operation, optimisticOperation }) => {
    const opExpected: Object = toOperationRaw({
      ...optimisticOperation,
    });
    delete opExpected.value;
    delete opExpected.fee;
    delete opExpected.date;
    delete opExpected.blockHash;
    delete opExpected.blockHeight;
    expect(toOperationRaw(operation)).toMatchObject(opExpected);
  },
  mutations: [
    {
      name: "send 50%~",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, 2);
        let amount = account.spendableBalance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        if (isAccountEmpty(sibling) && amount.lt(EXISTENTIAL_DEPOSIT)) {
          invariant(
            account.spendableBalance.gt(
              EXISTENTIAL_DEPOSIT.plus(POLKADOT_MIN_SAFE)
            ),
            "send is too low to activate account"
          );
          amount = EXISTENTIAL_DEPOSIT.plus(POLKADOT_MIN_SAFE);
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            { recipient: pickSiblings(siblings, 1).freshAddress },
            {
              amount,
            },
          ],
        };
      },
    },
    {
      name: "bond - bondExtra",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        invariant(canBond(account), "can't bond");
        const { polkadotResources } = account;
        invariant(polkadotResources, "polkadot");

        const options = [];
        if (isFirstBond(account)) {
          invariant(
            account.balance.gt(EXISTENTIAL_DEPOSIT.plus(POLKADOT_MIN_SAFE)),
            "cant cover fee + bonding amount"
          );
          options.push({
            recipient: account.freshAddress,
            rewardDestination: "Stash",
          });
          options.push({ amount: EXISTENTIAL_DEPOSIT });
        } else {
          invariant(
            account.spendableBalance.gt(POLKADOT_MIN_SAFE),
            "cant cover fee + bonding amount"
          );
          options.push({
            amount: BigNumber(100000),
          });
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "bond" }, ...options],
        };
      },
    },
    {
      name: "unbond",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        invariant(canUnbond(account), "can't unbond");
        const { polkadotResources } = account;
        invariant(polkadotResources, "polkadot");
        invariant(
          account.spendableBalance.gt(POLKADOT_MIN_SAFE),
          "cant cover fee"
        );
        const amount = polkadotResources.lockedBalance
          .minus(polkadotResources.unlockingBalance)
          .times(0.2);

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "unbond" }, { amount }],
        };
      },
    },
    {
      name: "rebond",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        invariant(account.polkadotResources?.unlockingBalance, "can't rebond");
        const { polkadotResources } = account;
        invariant(polkadotResources, "polkadot");
        invariant(
          account.spendableBalance.gt(POLKADOT_MIN_SAFE),
          "cant cover fee"
        );
        const amount = polkadotResources.unlockingBalance.times(0.2);

        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "rebond" }, { amount }],
        };
      },
    },
    {
      name: "nominate",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        invariant(canNominate(account), "can't nominate");
        const { polkadotResources } = account;
        invariant(polkadotResources, "polkadot");
        invariant(
          account.spendableBalance.gt(POLKADOT_MIN_SAFE),
          "cant cover fee"
        );
        const data = getCurrentPolkadotPreloadData();
        const validators = sampleSize(
          data.validators.map((v) => v.address),
          2
        );

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            { mode: "nominate" },
            ...validators.map((_, i) => ({
              validators: validators.slice(0, i + 1),
            })),
          ],
        };
      },
    },
  ],
};

export default { polkadot };
