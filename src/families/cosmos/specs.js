// @flow
import expect from "expect";
import sample from "lodash/sample";
import sampleSize from "lodash/sampleSize";
import invariant from "invariant";
import type { Transaction } from "../../families/cosmos/types";
import { getCurrentCosmosPreloadData } from "../../families/cosmos/preloadedData";
import { getCryptoCurrencyById } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import {
  canClaimRewards,
  canDelegate,
  canUndelegate,
  canRedelegate,
  getMaxDelegationAvailable,
} from "./logic";

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
      transaction: ({ account, bridge }) => {
        invariant(canDelegate(account), "can delegate");
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        invariant(
          cosmosResources.delegations.length < 3,
          "already enough delegations"
        );
        const data = getCurrentCosmosPreloadData();
        const all = data.validators.filter(
          (v) =>
            !cosmosResources.delegations.some(
              (d) => d.validatorAddress === v.validatorAddress
            )
        );

        const count = 1 + Math.floor(6 * Math.random());
        const amount = getMaxDelegationAvailable(account, count);
        const validators = sampleSize(all, count).map((delegation) => {
          return {
            address: delegation.validatorAddress,
            amount: amount.div(10).integerValue(),
          };
        });
        invariant(validators.length > 0, "no possible delegation found");
        let t = bridge.createTransaction(account);
        t = bridge.updateTransaction(t, {
          mode: "delegate",
          validators,
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
        invariant(canUndelegate(account), "can undelegate");
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
        const undelegateCandidate = sample(
          cosmosResources.delegations.filter(
            (d) =>
              !cosmosResources.redelegations.some(
                (r) => r.validatorSrcAddress === d.validatorAddress
                // FIXME do we need to filter out Dst too?
              ) &&
              !cosmosResources.unbondings.some(
                (r) => r.validatorAddress === d.validatorAddress
              )
          )
        );
        invariant(undelegateCandidate, "already pending");
        let t = bridge.createTransaction(account);
        t = bridge.updateTransaction(t, {
          mode: "undelegate",
          validators: [
            {
              address: undelegateCandidate.validatorAddress,
              amount: undelegateCandidate.amount
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
        const sourceDelegation = sample(
          cosmosResources.delegations.filter((d) => canRedelegate(account, d))
        );
        invariant(sourceDelegation, "none can redelegate");
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
        const delegation = sample(
          cosmosResources.delegations.filter((d) => canClaimRewards(account, d))
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
