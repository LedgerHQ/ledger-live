import expect from "expect";
import sample from "lodash/sample";
import sampleSize from "lodash/sampleSize";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type {
  CosmosDelegation,
  CosmosRedelegation,
  CosmosResources,
  CosmosUnbonding,
  Transaction,
} from "../../families/cosmos/types";
import { getCurrentCosmosPreloadData } from "../../families/cosmos/preloadedData";
import { getCryptoCurrencyById } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { toOperationRaw } from "../../account";
import {
  COSMOS_MIN_SAFE,
  canClaimRewards,
  canDelegate,
  canUndelegate,
  canRedelegate,
  getMaxDelegationAvailable,
} from "./logic";
import { DeviceModelId } from "@ledgerhq/devices";
const cosmos: AppSpec<Transaction> = {
  name: "Cosmos",
  currency: getCryptoCurrencyById("cosmos"),
  appQuery: {
    model: DeviceModelId.nanoS,
    firmware: "<2",
    appName: "Cosmos",
  },
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(COSMOS_MIN_SAFE), "balance is too low");
  },
  test: ({ operation, optimisticOperation }) => {
    const opExpected: Record<string, any> = toOperationRaw({
      ...optimisticOperation,
    });
    delete opExpected.value;
    delete opExpected.fee;
    delete opExpected.date;
    delete opExpected.blockHash;
    delete opExpected.blockHeight;
    expect(toOperationRaw(operation)).toMatchObject(opExpected); // TODO check it is between operation.value-fees (excluded) and operation.value

    /*
    // balance move
    expect(account.balance.toString()).toBe(
      accountBeforeTransaction.balance.minus(operation.value).toString()
    );
    */
  },
  mutations: [
    {
      name: "send some",
      maxRun: 2,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: pickSiblings(siblings, 7).freshAddress,
            },
            {
              amount: maxSpendable
                .times(0.3 + 0.4 * Math.random())
                .integerValue(),
            },
            Math.random() < 0.5
              ? {
                  memo: "LedgerLiveBot",
                }
              : null,
          ],
        };
      },
    },
    {
      name: "send max",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: pickSiblings(siblings, 7).freshAddress,
            },
            {
              useAllAmount: true,
            },
          ],
        };
      },
      test: ({ account }) => {
        expect(account.spendableBalance.toString()).toBe("0");
      },
    },
    {
      name: "delegate new validators",
      maxRun: 2,
      transaction: ({ account, bridge }) => {
        invariant(
          account.index % 10 > 0,
          "one out of 10 accounts is not going to delegate"
        );
        invariant(canDelegate(account), "can delegate");
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        invariant(
          (cosmosResources as CosmosResources).delegations.length < 10,
          "already enough delegations"
        );
        const data = getCurrentCosmosPreloadData();
        const count = 1 + Math.floor(5 * Math.random());
        let remaining = getMaxDelegationAvailable(account, count).times(
          Math.random()
        );
        const all = data.validators.filter(
          (v) =>
            !(cosmosResources as CosmosResources).delegations.some(
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
          const d = (cosmosResources as CosmosResources).delegations.find(
            (d) => d.validatorAddress === v.address
          );
          invariant(d, "delegated %s must be found in account", v.address);
          expect({
            address: v.address,
            // we round last digit
            amount: "~" + v.amount.div(10).integerValue().times(10).toString(),
          }).toMatchObject({
            address: (d as CosmosDelegation).validatorAddress,
            amount:
              "~" +
              (d as CosmosDelegation).amount
                .div(10)
                .integerValue()
                .times(10)
                .toString(),
          });
        });
      },
    },
    {
      name: "undelegate",
      maxRun: 3,
      transaction: ({ account, bridge }) => {
        invariant(canUndelegate(account), "can undelegate");
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        invariant(
          (cosmosResources as CosmosResources).delegations.length > 0,
          "already enough delegations"
        );
        const undelegateCandidate = sample(
          (cosmosResources as CosmosResources).delegations.filter(
            (d) =>
              !(cosmosResources as CosmosResources).redelegations.some(
                (r) =>
                  r.validatorSrcAddress === d.validatorAddress ||
                  r.validatorDstAddress === d.validatorAddress
              ) &&
              !(cosmosResources as CosmosResources).unbondings.some(
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
                  address: (undelegateCandidate as CosmosDelegation)
                    .validatorAddress,
                  amount: (undelegateCandidate as CosmosDelegation).amount // most of the time, undelegate all
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
          const d = (cosmosResources as CosmosResources).unbondings.find(
            (d) => d.validatorAddress === v.address
          );
          invariant(d, "undelegated %s must be found in account", v.address);
          expect({
            address: v.address,
            // we round last digit
            amount: "~" + v.amount.div(10).integerValue().times(10).toString(),
          }).toMatchObject({
            address: (d as CosmosUnbonding).validatorAddress,
            amount:
              "~" +
              (d as CosmosUnbonding).amount
                .div(10)
                .integerValue()
                .times(10)
                .toString(),
          });
        });
      },
    },
    {
      name: "redelegate",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        const sourceDelegation = sample(
          (cosmosResources as CosmosResources).delegations.filter((d) =>
            canRedelegate(account, d)
          )
        );
        invariant(sourceDelegation, "none can redelegate");
        const delegation = sample(
          (cosmosResources as CosmosResources).delegations.filter(
            (d) =>
              d.validatorAddress !==
              (sourceDelegation as CosmosDelegation).validatorAddress
          )
        );
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "redelegate",
              memo: "LedgerLiveBot",
              cosmosSourceValidator: (sourceDelegation as CosmosDelegation)
                .validatorAddress,
              validators: [
                {
                  address: (delegation as CosmosDelegation).validatorAddress,
                  amount: (sourceDelegation as CosmosDelegation).amount
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
          const d = (cosmosResources as CosmosResources).redelegations
            .slice(0) // recent first
            .sort(
              // FIXME: valueOf for date arithmetic operations in typescript
              (a, b) => b.completionDate.valueOf() - a.completionDate.valueOf()
            ) // find the related redelegation
            .find(
              (d) =>
                d.validatorDstAddress === v.address &&
                d.validatorSrcAddress === transaction.cosmosSourceValidator
            );
          invariant(d, "redelegated %s must be found in account", v.address);
          expect({
            address: v.address,
            // we round last digit
            amount: "~" + v.amount.div(10).integerValue().times(10).toString(),
          }).toMatchObject({
            address: (d as CosmosRedelegation).validatorDstAddress,
            amount:
              "~" +
              (d as CosmosRedelegation).amount
                .div(10)
                .integerValue()
                .times(10)
                .toString(),
          });
        });
      },
    },
    {
      name: "claim rewards",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        const { cosmosResources } = account;
        invariant(cosmosResources, "cosmos");
        const delegation = sample(
          (cosmosResources as CosmosResources).delegations.filter(
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
                  address: (delegation as CosmosDelegation).validatorAddress,
                  // TODO: the test should be
                  // amount: delegation.pendingRewards,
                  // but it won't work until COIN-665 is fixed until then,
                  // amount is set to 0 in
                  // src/families/cosmos/libcore-buildOperation in the REWARD case
                  amount: new BigNumber(0),
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
          const d = (cosmosResources as CosmosResources).delegations.find(
            (d) => d.validatorAddress === v.address
          );
          invariant(d, "delegation %s must be found in account", v.address);
          invariant(
            !canClaimRewards(account, d as CosmosDelegation),
            "reward no longer be claimable"
          );
        });
      },
    },
  ],
};
export default {
  cosmos,
};
