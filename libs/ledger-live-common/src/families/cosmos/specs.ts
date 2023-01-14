import expect from "expect";
import sample from "lodash/sample";
import sampleSize from "lodash/sampleSize";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type {
  CosmosAccount,
  CosmosDelegation,
  CosmosRedelegation,
  CosmosResources,
  CosmosUnbonding,
  Transaction,
} from "../../families/cosmos/types";
import { getCurrentCosmosPreloadData } from "../../families/cosmos/preloadedData";
import { getCryptoCurrencyById } from "../../currencies";
import {
  pickSiblings,
  botTest,
  expectSiblingsHaveSpendablePartGreaterThan,
  genericTestDestination,
} from "../../bot/specs";
import type { AppSpec, MutationSpec } from "../../bot/types";
import { toOperationRaw } from "../../account";
import {
  canDelegate,
  canUndelegate,
  canRedelegate,
  getMaxDelegationAvailable,
} from "./logic";
import { DeviceModelId } from "@ledgerhq/devices";
import { acceptTransaction } from "./speculos-deviceActions";
import cryptoFactory from "./chain/chain";
import { Account, Operation } from "@ledgerhq/types-live";

const maxAccounts = 16;

// amounts of delegation are not exact so we are applying an approximation
function approximateValue(value) {
  return "~" + value.div(100).integerValue().times(100).toString();
}

function approximateExtra(extra) {
  extra = { ...extra };
  if (extra.validators && Array.isArray(extra.validators)) {
    extra.validators = extra.validators.map((v) => {
      if (!v) return v;
      const { amount, ...rest } = v;
      if (!amount || typeof amount !== "string") return v;
      return { ...rest, amount: approximateValue(new BigNumber(amount)) };
    });
  }
  return extra;
}

const cosmosLikeTest: ({
  account,
  operation,
  optimisticOperation,
}: {
  account: Account;
  operation: Operation;
  optimisticOperation: Operation;
}) => void = ({ account, operation, optimisticOperation }) => {
  const allOperationsMatchingId = account.operations.filter(
    (op) => op.id === operation.id
  );
  if (allOperationsMatchingId.length > 1) {
    console.warn(allOperationsMatchingId);
  }
  botTest("only one operation emerged on the tx id", () =>
    expect({ allOperationsMatchingId }).toEqual({
      allOperationsMatchingId: [operation],
    })
  );
  const opExpected: Record<string, any> = toOperationRaw({
    ...optimisticOperation,
  });
  delete opExpected.value;
  delete opExpected.fee;
  delete opExpected.date;
  delete opExpected.blockHash;
  delete opExpected.blockHeight;
  const extra = opExpected.extra;
  delete opExpected.extra;
  delete opExpected.transactionSequenceNumber;
  const op = toOperationRaw(operation);
  botTest("optimistic operation matches op", () =>
    expect(op).toMatchObject(opExpected)
  );
  botTest("operation extra matches", () =>
    expect(approximateExtra(op.extra)).toMatchObject(approximateExtra(extra))
  );
};

function cosmosLikeMutations(currency: string): MutationSpec<Transaction>[] {
  return [
    {
      name: "send some",
      maxRun: 2,
      testDestination: genericTestDestination,
      test: ({ account, accountBeforeTransaction, operation }) => {
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        );
      },
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        const amount = maxSpendable
          .times(0.3 + 0.4 * Math.random())
          .integerValue();
        invariant(amount.gt(0), "random amount to be positive");
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: pickSiblings(siblings, maxAccounts).freshAddress,
            },
            {
              amount,
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
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge }) => {
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: pickSiblings(siblings, maxAccounts).freshAddress,
            },
            {
              useAllAmount: true,
            },
          ],
        };
      },
      test: ({ account }) => {
        botTest("spendableBalance should go to ZERO", () =>
          expect(account.spendableBalance.toString()).toBe("0")
        );
      },
    },
    {
      name: "delegate new validators",
      maxRun: 1,
      transaction: ({ account, bridge, siblings }) => {
        expectSiblingsHaveSpendablePartGreaterThan(siblings, 0.5);
        invariant(
          account.index % 2 > 0,
          "only one out of 2 accounts is not going to delegate"
        );
        invariant(canDelegate(account as CosmosAccount), "can delegate");
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        invariant(
          (cosmosResources as CosmosResources).delegations.length < 3,
          "already enough delegations"
        );
        const data = getCurrentCosmosPreloadData()[account.currency.id];
        const count = 1; // we'r always going to have only one validator because of the new delegation flow.
        let remaining = getMaxDelegationAvailable(
          account as CosmosAccount,
          count
        )
          .minus(cryptoFactory(currency).minimalTransactionAmount.times(2))
          .times(0.1 * Math.random());
        invariant(remaining.gt(0), "not enough funds in account for delegate");
        const all = data.validators.filter(
          (v) =>
            !(cosmosResources as CosmosResources).delegations.some(
              // new delegations only
              (d) => d.validatorAddress === v.validatorAddress
            )
        );
        invariant(all.length > 0, "no validators found");
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
            {
              validators: validators,
            },
            { amount: validators[0].amount },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        transaction.validators.forEach((v) => {
          const d = (cosmosResources as CosmosResources).delegations.find(
            (d) => d.validatorAddress === v.address
          );
          invariant(d, "delegated %s must be found in account", v.address);
          botTest("delegator have planned address and amount", () =>
            expect({
              address: v.address,
              amount: approximateValue(v.amount),
            }).toMatchObject({
              address: (d as CosmosDelegation).validatorAddress,
              amount: approximateValue((d as CosmosDelegation).amount),
            })
          );
        });
      },
    },
    {
      name: "undelegate",
      maxRun: 5,
      transaction: ({ account, bridge }) => {
        invariant(canUndelegate(account as CosmosAccount), "can undelegate");
        const { cosmosResources } = account as CosmosAccount;
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

        const amount = (undelegateCandidate as CosmosDelegation).amount
          .times(Math.random() > 0.2 ? 1 : Math.random()) // most of the time, undelegate all
          .integerValue();
        invariant(amount.gt(0), "random amount to be positive");

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
                  amount,
                },
              ],
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        transaction.validators.forEach((v) => {
          const d = (cosmosResources as CosmosResources).unbondings.find(
            (d) => d.validatorAddress === v.address
          );
          invariant(d, "undelegated %s must be found in account", v.address);
          botTest("validator have planned address and amount", () =>
            expect({
              address: v.address,
              amount: approximateValue(v.amount),
            }).toMatchObject({
              address: (d as CosmosUnbonding).validatorAddress,
              amount: approximateValue((d as CosmosUnbonding).amount),
            })
          );
        });
      },
    },
    {
      name: "redelegate",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        const sourceDelegation = sample(
          (cosmosResources as CosmosResources).delegations.filter((d) =>
            canRedelegate(account as CosmosAccount, d)
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
        const amount = (sourceDelegation as CosmosDelegation).amount
          .times(
            // most of the time redelegate all
            Math.random() > 0.2 ? 1 : Math.random()
          )
          .integerValue();
        invariant(amount.gt(0), "random amount to be positive");
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "redelegate",
              memo: "LedgerLiveBot",
              sourceValidator: (sourceDelegation as CosmosDelegation)
                .validatorAddress,
              validators: [
                {
                  address: (delegation as CosmosDelegation).validatorAddress,
                  amount,
                },
              ],
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        transaction.validators.forEach((v) => {
          // we possibly are moving from one existing delegation to another existing.
          // in that case it's not a redelegation, it effects immediately
          const existing = (
            cosmosResources as CosmosResources
          ).delegations.find((d) => d.validatorAddress === v.address);
          if (!existing) {
            // in other case, we will find it in a redelegation
            const d = (cosmosResources as CosmosResources).redelegations
              .slice(0) // recent first
              .sort(
                // FIXME: valueOf for date arithmetic operations in typescript
                (a, b) =>
                  b.completionDate.valueOf() - a.completionDate.valueOf()
              ) // find the related redelegation
              .find(
                (d) =>
                  d.validatorDstAddress === v.address &&
                  d.validatorSrcAddress === transaction.sourceValidator
              );
            invariant(d, "redelegated %s must be found in account", v.address);
            botTest("validator have planned address and amount", () =>
              expect({
                address: v.address,
                amount: approximateValue(v.amount),
              }).toMatchObject({
                address: (d as CosmosRedelegation).validatorDstAddress,
                amount: approximateValue((d as CosmosRedelegation).amount),
              })
            );
          }
        });
      },
    },
    {
      name: "claim rewards",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        const delegation = sample(
          (cosmosResources as CosmosResources).delegations.filter((d) =>
            d.pendingRewards.gt(1000)
          )
        ) as CosmosDelegation;
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
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        transaction.validators.forEach((v) => {
          const d = (cosmosResources as CosmosResources).delegations.find(
            (d) => d.validatorAddress === v.address
          );
          botTest("delegation exists in account", () =>
            invariant(d, "delegation %s must be found in account", v.address)
          );
          botTest("reward is no longer claimable after claim", () =>
            invariant(
              d?.pendingRewards.lte(d.amount.multipliedBy(0.1)),
              "pending reward is not reset"
            )
          );
        });
      },
    },
  ];
}

const cosmos: AppSpec<Transaction> = {
  name: "Cosmos",
  currency: getCryptoCurrencyById("cosmos"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Cosmos",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  minViableAmount: cryptoFactory("cosmos").minimalTransactionAmount,
  transactionCheck: ({ maxSpendable }) => {
    invariant(
      maxSpendable.gt(cryptoFactory("cosmos").minimalTransactionAmount),
      "balance is too low"
    );
  },
  test: cosmosLikeTest,
  mutations: cosmosLikeMutations("cosmos"),
};

const osmosis: AppSpec<Transaction> = {
  name: "Osmosis",
  currency: getCryptoCurrencyById("osmosis"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Cosmos",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 8 * 60 * 1000,
  minViableAmount: cryptoFactory("osmosis").minimalTransactionAmount,
  transactionCheck: ({ maxSpendable }) => {
    invariant(
      maxSpendable.gt(cryptoFactory("osmosis").minimalTransactionAmount),
      "balance is too low"
    );
  },
  test: cosmosLikeTest,
  mutations: cosmosLikeMutations("osmosis"),
};

export default {
  cosmos,
  osmosis,
};
