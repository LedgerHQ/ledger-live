import { BigNumber } from "bignumber.js";
import expect from "expect";
import invariant from "invariant";
import sample from "lodash/sample";
import sampleSize from "lodash/sampleSize";
import {
  botTest,
  expectSiblingsHaveSpendablePartGreaterThan,
  genericTestDestination,
  pickSiblings,
  SpeculosButton,
} from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec, MutationSpec } from "@ledgerhq/coin-framework/bot/types";
import { toOperationRaw } from "@ledgerhq/coin-framework/serialization";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { DeviceModelId } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";
import { Operation } from "@ledgerhq/types-live";
import { canDelegate, canRedelegate, canUndelegate, getMaxDelegationAvailable } from "./logic";
import { getCurrentCosmosPreloadData } from "./preloadedData";
import { acceptTransaction } from "./speculos-deviceActions";
import type {
  CosmosAccount,
  CosmosDelegation,
  CosmosDelegationInfoRaw,
  CosmosOperationExtraRaw,
  CosmosOperationRaw,
  CosmosRedelegation,
  CosmosResources,
  CosmosUnbonding,
  Transaction,
} from "./types";

const maxAccounts = 16;

// amounts of delegation are not exact so we are applying an approximation
function checkAmountsCloseEnough(amount1: BigNumber | string, amount2: BigNumber | string) {
  amount1 = new BigNumber(amount1);
  amount2 = new BigNumber(amount2);
  expect(amount1.isNegative()).toBe(false);
  expect(amount2.isNegative()).toBe(false);
  const difference = amount1.minus(amount2).absoluteValue();
  const onePercentOfLargerNumber = BigNumber.max(amount1, amount2).multipliedBy(0.01);
  const isCloseEnough = difference.isLessThan(onePercentOfLargerNumber);
  if (!isCloseEnough) {
    log(
      "bot",
      "delegation amounts do not match",
      `Amount1: ${amount1.toString()} , Amount2: ${amount2.toString()}`,
    );
  }
  expect(isCloseEnough).toBe(true);
}

function extraWithoutAmount(extra: CosmosOperationExtraRaw) {
  if (extra.validators && Array.isArray(extra.validators)) {
    extra.validators = extra.validators.map((validator: CosmosDelegationInfoRaw) => {
      return { ...validator, amount: "" };
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
  botTest("operation extra matches", () => {
    // compare the validators amount firstly
    if (
      expectedExtra.validators &&
      Array.isArray(expectedExtra.validators) &&
      expectedExtra.validators.length > 0
    ) {
      for (let i = 0; i < expectedExtra.validators.length; i++) {
        checkAmountsCloseEnough(opExtra.validators![i].amount, expectedExtra.validators[i].amount);
      }
    }
    // compare the rest of the extra, except the amount
    expect(extraWithoutAmount(opExtra)).toMatchObject(extraWithoutAmount(expectedExtra));
  });
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
          botTest("delegator have planned address and amount", () => {
            expect(v.address).toBe((d as CosmosDelegation).validatorAddress);
            checkAmountsCloseEnough(v.amount, (d as CosmosDelegation).amount);
          });
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
          botTest("validator have planned address and amount", () => {
            expect(v.address).toBe((d as CosmosUnbonding).validatorAddress);
            checkAmountsCloseEnough(v.amount, (d as CosmosUnbonding).amount);
          });
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
            botTest("validator have planned address and amount", () => {
              expect(v.address).toBe((d as CosmosRedelegation).validatorDstAddress);
              checkAmountsCloseEnough(v.amount, (d as CosmosRedelegation).amount);
            });
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

const generateGenericCosmosTest = (
  currencyId: string,
  isExpertModeRequired: boolean,
  config?: Partial<AppSpec<Transaction>>,
) => {
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
    onSpeculosDeviceCreated: isExpertModeRequired
      ? async ({ transport }: { transport: any }) => {
          await transport.button(SpeculosButton.RIGHT);
          await transport.button(SpeculosButton.BOTH);
        }
      : undefined,
    ...config,
  };
};

// In the bot tests, when we make a transaction ,we should make sure that the spendable balance is greater than minimalTransactionAmount.
// We usually use the upper limit of send transaction fee as the minimalTransactionAmount. e.g. 5000 uatom for cosmos.
const cosmosMinimalTransactionAmount = new BigNumber(5000);
const cosmos = {
  ...generateGenericCosmosTest("cosmos", false, {
    minViableAmount: cosmosMinimalTransactionAmount,
    mutations: cosmosLikeMutations(cosmosMinimalTransactionAmount),
  }),
};

const osmosisMinimalTransactionAmount = new BigNumber(5000);
const osmosis = {
  ...generateGenericCosmosTest("osmosis", false, {
    minViableAmount: osmosisMinimalTransactionAmount,
    mutations: cosmosLikeMutations(osmosisMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
  }),
};

const desmosMinimalTransactionAmount = new BigNumber(500);
const desmos = {
  ...generateGenericCosmosTest("desmos", false, {
    minViableAmount: desmosMinimalTransactionAmount,
    mutations: cosmosLikeMutations(desmosMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const dydxMinimalTransactionAmount = new BigNumber(500);
const dydx = {
  ...generateGenericCosmosTest("dydx", false, {
    minViableAmount: dydxMinimalTransactionAmount,
    mutations: cosmosLikeMutations(dydxMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const umeeMinimalTransactionAmount = new BigNumber(15000);
const umee = {
  ...generateGenericCosmosTest("umee", false, {
    minViableAmount: umeeMinimalTransactionAmount,
    mutations: cosmosLikeMutations(umeeMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const persistenceMinimalTransactionAmount = new BigNumber(5000);
const persistence = {
  ...generateGenericCosmosTest("persistence", false, {
    minViableAmount: persistenceMinimalTransactionAmount,
    mutations: cosmosLikeMutations(persistenceMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const quicksilverMinimalTransactionAmount = new BigNumber(600);
const quicksilver = {
  ...generateGenericCosmosTest("quicksilver", false, {
    minViableAmount: quicksilverMinimalTransactionAmount,
    mutations: cosmosLikeMutations(quicksilverMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const onomyMinimalTransactionAmount = new BigNumber(5000);
const onomy = {
  ...generateGenericCosmosTest("onomy", false, {
    minViableAmount: onomyMinimalTransactionAmount,
    mutations: cosmosLikeMutations(onomyMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const seiMinimalTransactionAmount = new BigNumber(5000);
const sei = {
  ...generateGenericCosmosTest("sei_network", false, {
    minViableAmount: onomyMinimalTransactionAmount,
    mutations: cosmosLikeMutations(seiMinimalTransactionAmount),
    testTimeout: 8 * 60 * 1000,
    skipOperationHistory: true,
  }),
};

const axelarMinimalTransactionAmount = new BigNumber(10000);
const axelar = {
  ...generateGenericCosmosTest("axelar", false, {
    minViableAmount: axelarMinimalTransactionAmount,
    mutations: cosmosLikeMutations(axelarMinimalTransactionAmount),
    skipOperationHistory: true,
  }),
};

const secretNetworkMinimalTransactionAmount = new BigNumber(60000);
const secretNetwork = {
  ...generateGenericCosmosTest("secret_network", false, {
    minViableAmount: secretNetworkMinimalTransactionAmount,
    mutations: cosmosLikeMutations(secretNetworkMinimalTransactionAmount),
    skipOperationHistory: true,
  }),
};

const stargazeMinimalTransactionAmount = new BigNumber(160000);
const stargaze = {
  ...generateGenericCosmosTest("stargaze", false, {
    minViableAmount: stargazeMinimalTransactionAmount,
    mutations: cosmosLikeMutations(stargazeMinimalTransactionAmount),
    skipOperationHistory: true,
  }),
};

const coreumMinimalTransactionAmount = new BigNumber(20000);
const coreum = {
  ...generateGenericCosmosTest("coreum", false, {
    minViableAmount: coreumMinimalTransactionAmount,
    mutations: cosmosLikeMutations(coreumMinimalTransactionAmount),
    skipOperationHistory: true,
  }),
};

const injectiveMinimalTransactionAmount = new BigNumber(1000000);
const injective = {
  ...generateGenericCosmosTest("injective", true, {
    minViableAmount: injectiveMinimalTransactionAmount,
    mutations: cosmosLikeMutations(injectiveMinimalTransactionAmount),
    skipOperationHistory: true,
  }),
};

const mantraMinimalTransactionAmount = new BigNumber(20000);
const mantra = {
  ...generateGenericCosmosTest("mantra", false, {
    minViableAmount: mantraMinimalTransactionAmount,
    mutations: cosmosLikeMutations(mantraMinimalTransactionAmount),
    skipOperationHistory: true,
  }),
};

const cryptoOrgMinimalTransactionAmount = new BigNumber(1000000);
const cryptoOrg = {
  ...generateGenericCosmosTest("crypto_org", false, {
    minViableAmount: cryptoOrgMinimalTransactionAmount,
    mutations: cosmosLikeMutations(cryptoOrgMinimalTransactionAmount),
    skipOperationHistory: true,
  }),
};

export default {
  axelar,
  cosmos,
  osmosis,
  desmos,
  dydx,
  umee,
  persistence,
  quicksilver,
  onomy,
  secretNetwork,
  sei,
  stargaze,
  coreum,
  injective,
  mantra,
  cryptoOrg,
};
