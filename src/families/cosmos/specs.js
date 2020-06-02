// @flow
import expect from "expect";
import sample from "lodash/sample";
import invariant from "invariant";
import type { Transaction } from "../../families/cosmos/types";
import { getCurrentCosmosPreloadData } from "../../families/cosmos/preloadedData";
import { getCryptoCurrencyById } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";

const cosmos: AppSpec<Transaction> = {
  name: "Cosmos",
  currency: getCryptoCurrencyById("cosmos"),
  appQuery: {
    model: "nanoS",
    appName: "Cosmos",
    appVersion: ">= 2.12.0",
  },
  mutations: [
    {
      name: "split half to another account",
      maxRun: 6,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(5000), "balance is too low");
        let t = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, 30);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();
        t = bridge.updateTransaction(t, { amount, recipient });
        return t;
      },
      test: ({ account, accountBeforeTransaction, status }) => {
        // can be generalized!
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(status.totalSpent).toString()
        );
      },
    },

    {
      name: "delegate 10% to a NEW validator",
      maxRun: 3,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(
          maxSpendable.gt(5000),
          "account don't have remaining spendable"
        );
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        invariant(
          cosmosResources.delegations.length < 3,
          "already enough delegations"
        );
        const data = getCurrentCosmosPreloadData();
        const delegation = sample(
          data.validators.filter(
            (v) =>
              !cosmosResources.delegations.some(
                (d) => d.validatorAddress === v.validatorAddress
              )
          )
        );
        invariant(delegation, "no possible delegation found");
        let t = bridge.createTransaction(account);
        t = bridge.updateTransaction(t, {
          mode: "delegate",
          validators: [
            {
              address: delegation.validatorAddress,
              amount: maxSpendable.div(10).integerValue(),
            },
          ],
        });
        return t;
      },
      test: () => {
        // TODO check the delegations appears
      },
    },

    {
      name: "undelegate an existing delegation without existing unbondings",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(
          maxSpendable.gt(5000),
          "account don't have remaining spendable"
        );
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        invariant(
          cosmosResources.delegations.length > 0,
          "already enough delegations"
        );
        invariant(
          cosmosResources.unbondings.length === 0,
          "already ongoing unbonding"
        );
        const sourceDelegation = sample(cosmosResources.delegations);
        const data = getCurrentCosmosPreloadData();
        const delegation = sample(
          data.validators.filter(
            (v) => !sourceDelegation.validatorAddress === v.validatorAddress
          )
        );
        let t = bridge.createTransaction(account);
        t = bridge.updateTransaction(t, {
          mode: "undelegate",
          validators: [
            {
              address: delegation.validatorAddress,
              amount: sourceDelegation.amount
                .times(Math.random())
                .integerValue(),
            },
          ],
        });
        return t;
      },
      test: () => {
        // TODO check the unbonding appears
      },
    },

    {
      name: "redelegate a delegation without existing redelegation/unbonding",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(
          maxSpendable.gt(5000),
          "account don't have remaining spendable"
        );
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        invariant(
          cosmosResources.delegations.length > 0,
          "already enough delegations"
        );
        invariant(
          cosmosResources.unbondings.length === 0,
          "already ongoing unbonding"
        );
        invariant(
          cosmosResources.redelegations.length === 0,
          "already ongoing redelegation"
        );
        const sourceDelegation = sample(cosmosResources.delegations);
        const delegation = sample(cosmosResources.delegations);
        let t = bridge.createTransaction(account);
        t = bridge.updateTransaction(t, {
          mode: "redelegate",
          cosmosSourceValidator: sourceDelegation.validatorAddress,
          validators: [
            {
              address: delegation.validatorAddress,
              amount: delegation.amount.times(Math.random()).integerValue(),
            },
          ],
        });
        return t;
      },
      test: () => {
        // TODO check the redelegation appears
      },
    },

    {
      name: "claim rewards",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(
          maxSpendable.gt(5000),
          "account don't have remaining spendable"
        );
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        const delegation = cosmosResources.delegations.find((d) =>
          d.pendingRewards.gt(5000)
        );
        invariant(delegation, "no delegation to claim");
        let t = bridge.createTransaction(account);
        t = bridge.updateTransaction(t, {
          mode: "claimReward",
          validators: [
            {
              address: delegation.validatorAddress,
              amount: delegation.pendingRewards,
            },
          ],
        });
        return t;
      },
      test: () => {
        // TODO check funds were claimed
      },
    },
  ],
};

export default { cosmos };
