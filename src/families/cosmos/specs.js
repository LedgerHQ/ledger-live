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
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.balance.gt(10000), "balance is too low");
        let t = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, 30);
        const recipient = sibling.freshAddress;
        const amount = account.balance.div(2).integerValue();
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
      name: "delegate 10% to ONE validator",
      transaction: ({ account, bridge }) => {
        invariant(account.balance.gt(10000), "balance is too low");
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
              amount: account.balance.div(10).integerValue(),
            },
          ],
        });
        return t;
      },
      test: () => {
        // TODO check the delegations appears
      },
    },
    // TODO redelegation
    // TODO undelegation
    {
      name: "claim rewards",
      transaction: ({ account, bridge }) => {
        invariant(account.balance.gt(10000), "balance is too low");
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        const delegation = cosmosResources.delegations.find((d) =>
          d.pendingRewards.gt(0)
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
