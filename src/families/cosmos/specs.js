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
import { getOperationAmountNumber } from "../../operation";
import {
  COSMOS_MIN_SAFE,
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
  },
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(COSMOS_MIN_SAFE), "balance is too low");
  },
  test: ({ account, accountBeforeTransaction, status }) => {
    const newOps = account.operations.slice(
      0,
      account.operations.length - accountBeforeTransaction.operations.length
    );
    invariant(newOps.length > 0, "new ops appeared");

    const feesOp = newOps.find((op) => op.type === "FEES");
    invariant(feesOp, "fees op exists");
    invariant(!getOperationAmountNumber(feesOp).gt(0), "fees op negative");
    invariant(
      !getOperationAmountNumber(feesOp).plus(status.estimatedFees).lt(0),
      "estimated fees should never be gt than the fees"
    );
    invariant(
      !getOperationAmountNumber(feesOp).plus(status.estimatedFees).lt(0),
      "estimated fees should never be gt than the fees"
    );
  },
  mutations: [
    {
      name: "send some to another account",
      maxRun: 5,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            { recipient: pickSiblings(siblings, 30).freshAddress },
            { amount: maxSpendable.div(2).integerValue() },
            Math.random() < 0.5 ? { memo: "LedgerLiveBot" } : null,
          ],
        };
      },
      test: ({ account, accountBeforeTransaction, status, transaction }) => {
        expect(account.operations.length).toBe(
          accountBeforeTransaction.operations.length + 2
        );
        const outOp = account.operations
          .slice(0, 2)
          .find((op) => op.type === "OUT");
        invariant(outOp, "out op is missing");

        if (transaction.memo) {
          expect(outOp.extra).toMatchObject({ memo: transaction.memo });
        }

        expect(getOperationAmountNumber(outOp).toString()).toBe(
          transaction.amount.negated().toString()
        );
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(status.totalSpent).toString()
        );
      },
    },

    {
      name: "send max to another account",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: pickSiblings(siblings, 30).freshAddress,
            },
            { useAllAmount: true },
          ],
        };
      },
      test: ({ account }) => {
        expect(account.spendableBalance.toString()).toBe("0");
      },
    },

    {
      name: "delegate new validators",
      maxRun: 3,
      transaction: ({ account, bridge }) => {
        invariant(
          account.index % 10 > 0,
          "one out of 10 accounts is not going to delegate"
        );
        invariant(canDelegate(account), "can delegate");
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        invariant(
          cosmosResources.delegations.length < 10,
          "already enough delegations"
        );
        const data = getCurrentCosmosPreloadData();
        const count = 1 + Math.floor(5 * Math.random());
        let remaining = getMaxDelegationAvailable(account, count).times(
          Math.random()
        );
        const all = data.validators.filter(
          (v) =>
            !cosmosResources.delegations.some(
              // new delegations only
              (d) => d.validatorAddress === v.validatorAddress
            )
        );
        const validators = sampleSize(all, count)
          .map((delegation) => {
            // take a bit of remaining each time (less is preferred with the random() square)
            const amount = remaining
              .times(Math.random() * Math.random())
              .integerValue();
            remaining = remaining.minus(amount);
            return {
              address: delegation.validatorAddress,
              amount,
            };
          })
          .filter((v) => v.amount.gt(0));
        invariant(validators.length > 0, "no possible delegation found");
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              memo: "LedgerLiveBot",
              mode: "delegate",
            },
            ...validators.map((_, i) => ({
              validators: validators.slice(0, i + 1),
            })),
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        transaction.validators.forEach((v) => {
          const d = cosmosResources.delegations.find(
            (d) => d.validatorAddress === v.address
          );
          invariant(d, "delegated %s must be found in account", v.address);
          expect({
            address: v.address,
            amount: v.amount.toString(),
          }).toMatchObject({
            address: d.validatorAddress,
            amount: d.amount.toString(),
          });
        });
      },
    },

    {
      name: "undelegate",
      maxRun: 2,
      transaction: ({ account, bridge }) => {
        invariant(canUndelegate(account), "can undelegate");
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
                (r) =>
                  r.validatorSrcAddress === d.validatorAddress ||
                  r.validatorDstAddress === d.validatorAddress
              ) &&
              !cosmosResources.unbondings.some(
                (r) => r.validatorAddress === d.validatorAddress
              )
          )
        );
        invariant(undelegateCandidate, "already pending");
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "undelegate",
              memo: "LedgerLiveBot",
            },
            {
              validators: [
                {
                  address: undelegateCandidate.validatorAddress,
                  amount: undelegateCandidate.amount
                    // most of the time, undelegate all
                    .times(Math.random() > 0.3 ? 1 : Math.random())
                    .integerValue(),
                },
              ],
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        transaction.validators.forEach((v) => {
          const d = cosmosResources.unbondings.find(
            (d) => d.validatorAddress === v.address
          );
          invariant(d, "undelegated %s must be found in account", v.address);
          expect({
            address: v.address,
            amount: v.amount.toString(),
          }).toMatchObject({
            address: d.validatorAddress,
            amount: d.amount.toString(),
          });
        });
      },
    },

    {
      name: "redelegate",
      maxRun: 2,
      transaction: ({ account, bridge }) => {
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        const sourceDelegation = sample(
          cosmosResources.delegations.filter((d) => canRedelegate(account, d))
        );
        invariant(sourceDelegation, "none can redelegate");
        const delegation = sample(
          cosmosResources.delegations.filter(
            (d) => d.validatorAddress !== sourceDelegation.validatorAddress
          )
        );
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "redelegate",
              memo: "LedgerLiveBot",
              cosmosSourceValidator: sourceDelegation.validatorAddress,
              validators: [
                {
                  address: delegation.validatorAddress,
                  amount: sourceDelegation.amount
                    .times(
                      // most of the time redelegate all
                      Math.random() > 0.3 ? 1 : Math.random()
                    )
                    .integerValue(),
                },
              ],
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        transaction.validators.forEach((v) => {
          const d = cosmosResources.redelegations.find(
            (d) => d.validatorDstAddress === v.address
          );
          invariant(d, "redelegated %s must be found in account", v.address);
          expect({
            address: v.address,
            amount: v.amount.toString(),
          }).toMatchObject({
            address: d.validatorDstAddress,
            amount: d.amount.toString(),
          });
        });
      },
    },

    {
      name: "claim rewards",
      maxRun: 2,
      transaction: ({ account, bridge }) => {
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        const delegation = sample(
          cosmosResources.delegations.filter(
            (d) => canClaimRewards(account, d) && d.pendingRewards.gt(2000)
          )
        );
        invariant(delegation, "no delegation to claim");
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "claimReward",
              memo: "LedgerLiveBot",
              validators: [
                {
                  address: delegation.validatorAddress,
                  amount: delegation.pendingRewards,
                },
              ],
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        transaction.validators.forEach((v) => {
          const d = cosmosResources.delegations.find(
            (d) => d.validatorAddress === v.address
          );
          invariant(d, "delegation %s must be found in account", v.address);
          invariant(
            !canClaimRewards(account, d),
            "reward no longer be claimable"
          );
        });
      },
    },
  ],
};

export default { cosmos };
