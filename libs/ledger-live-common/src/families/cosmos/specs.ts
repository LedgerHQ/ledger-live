import { DeviceModelId } from "@ledgerhq/devices";
import expect from "expect";
import invariant from "invariant";
import sample from "lodash/sample";
import sampleSize from "lodash/sampleSize";
import { toOperationRaw } from "../../account";
import {
  botTest,
  expectSiblingsHaveSpendablePartGreaterThan,
  genericTestDestination,
  pickSiblings,
} from "../../bot/specs";
import type { AppSpec, MutationSpec } from "../../bot/types";
import { getCryptoCurrencyById } from "../../currencies";
import { getCurrentCosmosPreloadData } from "../../families/cosmos/preloadedData";
import type {
  CosmosAccount,
  CosmosDelegation,
  CosmosOperationExtraRaw,
  CosmosDelegationInfoRaw,
  CosmosRedelegation,
  CosmosResources,
  CosmosUnbonding,
  Transaction,
  CosmosOperationRaw,
} from "../../families/cosmos/types";
import { canDelegate, canRedelegate, canUndelegate, getMaxDelegationAvailable } from "./logic";
import { acceptTransaction } from "./speculos-deviceActions";
import { Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

const maxAccounts = 16;

// amounts of delegation are not exact so we are applying an approximation
function approximateValue(value): string {
  const firstThreeDigits = parseInt(value.toString().slice(0, 3), 10);
  const firstTwoDigits = Math.round(firstThreeDigits / 10).toString();
  const tailZeroCount = value.toString().length - 2;
  return "~" + firstTwoDigits + "0".repeat(tailZeroCount);
}

function approximateExtra(extra: CosmosOperationExtraRaw) {
  if (extra.validators && Array.isArray(extra.validators)) {
    extra.validators = extra.validators.map((validator: CosmosDelegationInfoRaw) => {
      return { ...validator, amount: approximateValue(validator.amount) };
    });
  }
  return extra;
}

const cosmosLikeTest: ({
  account,
  operation,
  optimisticOperation,
}: {
  account: CosmosAccount;
  operation: Operation;
  optimisticOperation: Operation;
}) => void = ({ account, operation, optimisticOperation }) => {
  const allOperationsMatchingId = account.operations.filter(op => op.id === operation.id);
  if (allOperationsMatchingId.length > 1) {
    console.warn(allOperationsMatchingId);
  }
  botTest("only one operation emerged on the tx id", () =>
    expect({ allOperationsMatchingId }).toEqual({
      allOperationsMatchingId: [operation],
    }),
  );
  const opExpected: Partial<CosmosOperationRaw> = toOperationRaw({
    ...optimisticOperation,
  }) as CosmosOperationRaw;
  const expectedExtra: CosmosOperationExtraRaw = opExpected.extra || {};
  delete opExpected.value;
  delete opExpected.fee;
  delete opExpected.date;
  delete opExpected.blockHash;
  delete opExpected.blockHeight;
  delete opExpected.extra;
  delete opExpected.transactionSequenceNumber;
  delete opExpected.nftOperations;

  const op: Partial<CosmosOperationRaw> = toOperationRaw(operation) as CosmosOperationRaw;
  const opExtra: CosmosOperationExtraRaw = op.extra || {};
  delete op.extra;

  botTest("optimistic operation matches op", () => expect(op).toMatchObject(opExpected));
  botTest("operation extra matches", () =>
    expect(approximateExtra(opExtra)).toMatchObject(approximateExtra(expectedExtra)),
  );
};

function cosmosLikeMutations(minimalTransactionAmount: BigNumber): MutationSpec<Transaction>[] {
  return [
    {
      name: "send some",
      maxRun: 2,
      testDestination: genericTestDestination,
      test: ({ account, accountBeforeTransaction, operation }) => {
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString(),
        );
      },
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalTransactionAmount), "balance is too low for send");
        const amount = maxSpendable.times(0.3 + 0.4 * Math.random()).integerValue();
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
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalTransactionAmount), "balance is too low for send max");
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
          expect(account.spendableBalance.toString()).toBe("0"),
        );
      },
    },
    {
      name: "delegate new validators",
      maxRun: 1,
      transaction: ({ account, bridge, siblings }) => {
        expectSiblingsHaveSpendablePartGreaterThan(siblings, 0.5);
        invariant(account.index % 2 > 0, "only one out of 2 accounts is not going to delegate");
        invariant(canDelegate(account as CosmosAccount), "can delegate");
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        invariant(
          (cosmosResources as CosmosResources).delegations.length < 3,
          "already enough delegations",
        );
        const data = getCurrentCosmosPreloadData()[account.currency.id];
        const count = 1; // we'r always going to have only one validator because of the new delegation flow.
        let remaining = getMaxDelegationAvailable(account as CosmosAccount, count)
          .minus(minimalTransactionAmount.times(2))
          .times(0.1 * Math.random());
        invariant(remaining.gt(0), "not enough funds in account for delegate");
        const all = data.validators.filter(
          v =>
            !(cosmosResources as CosmosResources).delegations.some(
              // new delegations only
              d => d.validatorAddress === v.validatorAddress,
            ),
        );
        invariant(all.length > 0, "no validators found");
        const validators = sampleSize(all, count)
          .map(delegation => {
            // take a bit of remaining each time (less is preferred with the random() square)
            const amount = remaining.times(Math.random() * Math.random()).integerValue();
            remaining = remaining.minus(amount);
            return {
              address: delegation.validatorAddress,
              amount,
            };
          })
          .filter(v => v.amount.gt(0));
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
        transaction.validators.forEach(v => {
          const d = (cosmosResources as CosmosResources).delegations.find(
            d => d.validatorAddress === v.address,
          );
          invariant(d, "delegated %s must be found in account", v.address);
          botTest("delegator have planned address and amount", () =>
            expect({
              address: v.address,
              amount: approximateValue(v.amount),
            }).toMatchObject({
              address: (d as CosmosDelegation).validatorAddress,
              amount: approximateValue((d as CosmosDelegation).amount),
            }),
          );
        });
      },
    },
    {
      name: "undelegate",
      maxRun: 5,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(canUndelegate(account as CosmosAccount), "can undelegate");
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        invariant(maxSpendable.gt(minimalTransactionAmount.times(2)), "balance is too low");
        invariant(
          (cosmosResources as CosmosResources).delegations.length > 0,
          "already enough delegations",
        );
        const undelegateCandidate = sample(
          (cosmosResources as CosmosResources).delegations.filter(
            d =>
              !(cosmosResources as CosmosResources).redelegations.some(
                r =>
                  r.validatorSrcAddress === d.validatorAddress ||
                  r.validatorDstAddress === d.validatorAddress,
              ) &&
              !(cosmosResources as CosmosResources).unbondings.some(
                r => r.validatorAddress === d.validatorAddress,
              ),
          ),
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
                  address: (undelegateCandidate as CosmosDelegation).validatorAddress,
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
        transaction.validators.forEach(v => {
          const d = (cosmosResources as CosmosResources).unbondings.find(
            d => d.validatorAddress === v.address,
          );
          invariant(d, "undelegated %s must be found in account", v.address);
          botTest("validator have planned address and amount", () =>
            expect({
              address: v.address,
              amount: approximateValue(v.amount),
            }).toMatchObject({
              address: (d as CosmosUnbonding).validatorAddress,
              amount: approximateValue((d as CosmosUnbonding).amount),
            }),
          );
        });
      },
    },
    {
      name: "redelegate",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        invariant(
          maxSpendable.gt(minimalTransactionAmount.times(3)),
          "balance is too low for redelegate",
        );
        const sourceDelegation = sample(
          (cosmosResources as CosmosResources).delegations.filter(d =>
            canRedelegate(account as CosmosAccount, d),
          ),
        );
        invariant(sourceDelegation, "none can redelegate");
        const delegation = sample(
          (cosmosResources as CosmosResources).delegations.filter(
            d => d.validatorAddress !== (sourceDelegation as CosmosDelegation).validatorAddress,
          ),
        );
        const amount = (sourceDelegation as CosmosDelegation).amount
          .times(
            // most of the time redelegate all
            Math.random() > 0.2 ? 1 : Math.random(),
          )
          .integerValue();
        invariant(amount.gt(0), "random amount to be positive");
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "redelegate",
              memo: "LedgerLiveBot",
              sourceValidator: (sourceDelegation as CosmosDelegation).validatorAddress,
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
        transaction.validators.forEach(v => {
          // we possibly are moving from one existing delegation to another existing.
          // in that case it's not a redelegation, it effects immediately
          const existing = (cosmosResources as CosmosResources).delegations.find(
            d => d.validatorAddress === v.address,
          );
          if (!existing) {
            // in other case, we will find it in a redelegation
            const d = (cosmosResources as CosmosResources).redelegations
              .slice(0) // recent first
              .sort(
                // FIXME: valueOf for date arithmetic operations in typescript
                (a, b) => b.completionDate.valueOf() - a.completionDate.valueOf(),
              ) // find the related redelegation
              .find(
                d =>
                  d.validatorDstAddress === v.address &&
                  d.validatorSrcAddress === transaction.sourceValidator,
              );
            invariant(d, "redelegated %s must be found in account", v.address);
            botTest("validator have planned address and amount", () =>
              expect({
                address: v.address,
                amount: approximateValue(v.amount),
              }).toMatchObject({
                address: (d as CosmosRedelegation).validatorDstAddress,
                amount: approximateValue((d as CosmosRedelegation).amount),
              }),
            );
          }
        });
      },
    },
    {
      name: "claim rewards",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        const { cosmosResources } = account as CosmosAccount;
        invariant(cosmosResources, "cosmos");
        invariant(
          maxSpendable.gt(minimalTransactionAmount.times(2)),
          "balance is too low for claim rewards",
        );
        const delegation = sample(
          (cosmosResources as CosmosResources).delegations.filter(d => d.pendingRewards.gt(1000)),
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
        transaction.validators.forEach(v => {
          const d = (cosmosResources as CosmosResources).delegations.find(
            d => d.validatorAddress === v.address,
          );
          botTest("delegation exists in account", () =>
            invariant(d, "delegation %s must be found in account", v.address),
          );
          botTest("reward is no longer claimable after claim", () =>
            invariant(
              d?.pendingRewards.lte(d.amount.multipliedBy(0.1)),
              "pending reward is not reset",
            ),
          );
        });
      },
    },
  ];
}

const generateGenericCosmosTest = (currencyId: string, config?: Partial<AppSpec<Transaction>>) => {
  return {
    name: currencyId,
    currency: getCryptoCurrencyById(currencyId),
    appQuery: {
      model: DeviceModelId.nanoS,
      appName: "Cosmos",
    },
    genericDeviceAction: acceptTransaction,
    testTimeout: 2 * 60 * 1000,
    test: cosmosLikeTest,
    ...config,
  };
};

// In the bot tests, when we make a transaction ,we should make sure that the spendable balance is greater than minimalTransactionAmount.
// We usually use the upper limit of send transaction fee as the minimalTransactionAmount. e.g. 5000 uatom for cosmos.
const cosmosMinimalTransactionAmount = new BigNumber(5000);
const cosmos = {
  ...generateGenericCosmosTest("cosmos", {
    minViableAmount: cosmosMinimalTransactionAmount,
    mutations: cosmosLikeMutations(cosmosMinimalTransactionAmount),
  }),
};

const osmosisMinimalTransactionAmount = new BigNumber(5000);
const osmosis = {
  ...generateGenericCosmosTest("osmosis", {
    minViableAmount: osmosisMinimalTransactionAmount,
    mutations: cosmosLikeMutations(osmosisMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
  }),
};

const desmosMinimalTransactionAmount = new BigNumber(500);
const desmos = {
  ...generateGenericCosmosTest("desmos", {
    minViableAmount: desmosMinimalTransactionAmount,
    mutations: cosmosLikeMutations(desmosMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const umeeMinimalTransactionAmount = new BigNumber(15000);
const umee = {
  ...generateGenericCosmosTest("umee", {
    minViableAmount: umeeMinimalTransactionAmount,
    mutations: cosmosLikeMutations(umeeMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const persistenceMinimalTransactionAmount = new BigNumber(5000);
const persistence = {
  ...generateGenericCosmosTest("persistence", {
    minViableAmount: persistenceMinimalTransactionAmount,
    mutations: cosmosLikeMutations(persistenceMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
  }),
};

const quicksilverMinimalTransactionAmount = new BigNumber(600);
const quicksilver = {
  ...generateGenericCosmosTest("quicksilver", {
    minViableAmount: quicksilverMinimalTransactionAmount,
    mutations: cosmosLikeMutations(quicksilverMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const onomyMinimalTransactionAmount = new BigNumber(5000);
const onomy = {
  ...generateGenericCosmosTest("onomy", {
    minViableAmount: onomyMinimalTransactionAmount,
    mutations: cosmosLikeMutations(onomyMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
  }),
};

const axelarMinimalTransactionAmount = new BigNumber(10000);
const axelar = {
  ...generateGenericCosmosTest("axelar", {
    minViableAmount: axelarMinimalTransactionAmount,
    mutations: cosmosLikeMutations(axelarMinimalTransactionAmount),
    skipOperationHistory: true,
  }),
};

const secretNetworkMinimalTransactionAmount = new BigNumber(60000);
const secretNetwork = {
  ...generateGenericCosmosTest("secret_network", {
    minViableAmount: secretNetworkMinimalTransactionAmount,
    mutations: cosmosLikeMutations(secretNetworkMinimalTransactionAmount),
  }),
};

const stargazeMinimalTransactionAmount = new BigNumber(160000);
const stargaze = {
  ...generateGenericCosmosTest("stargaze", {
    minViableAmount: stargazeMinimalTransactionAmount,
    mutations: cosmosLikeMutations(stargazeMinimalTransactionAmount),
  }),
};

const coreumMinimalTransactionAmount = new BigNumber(20000);
const coreum = {
  ...generateGenericCosmosTest("coreum", {
    minViableAmount: coreumMinimalTransactionAmount,
    mutations: cosmosLikeMutations(coreumMinimalTransactionAmount),
  }),
};

export default {
  axelar,
  cosmos,
  osmosis,
  desmos,
  umee,
  persistence,
  quicksilver,
  onomy,
  secretNetwork,
  stargaze,
  coreum,
};
