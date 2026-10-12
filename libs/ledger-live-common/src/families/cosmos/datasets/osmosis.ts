import { BigNumber } from "bignumber.js";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  AmountRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import invariant from "invariant";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "@ledgerhq/coin-cosmos/transaction";
import { AccountRaw, CurrenciesData, isStakingAccount } from "@ledgerhq/types-live";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["sequence", "stakingResources", "operationsCount", "operations"],
  FIXME_ignorePreloadFields: ["validators"], // the APY of validators changes over time
  scanAccounts: [
    {
      name: "osmo seed 1",
      apdus: `
        => 5504000019046f736d6f2c00008076000080000000800000000000000000
        <= 02dc75cfe8137450ae2259dc7f29fd8767951956cc943adb4387e91c37a058a9f06f736d6f3137676d6378796335636364356b77717161747067666467683338307732686337377a6d307a779000
        => 5504000019046f736d6f2c00008076000080000000800000000000000000
        <= 02dc75cfe8137450ae2259dc7f29fd8767951956cc943adb4387e91c37a058a9f06f736d6f3137676d6378796335636364356b77717161747067666467683338307732686337377a6d307a779000
        => 5504000019046f736d6f2c00008076000080010000800000000000000000
        <= 0246b68a4f546af213bca96b0a0d0319b1ffa3c194cd89b16e48c349492e3b36e66f736d6f3139683863656e6e726b663039736a78717433366c6d6b3933667a7972637772667877373834799000
        `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:osmo:osmo10h50supk4en682vrjkc6wkgkpcyxyqn4vxjy2c:",
        seedIdentifier: "0283de657d9e283a5c31d64a4c4afbcc48ee79fdd7648bcdde6a1d0d7ae9f9bea1",
        xpub: "osmo10h50supk4en682vrjkc6wkgkpcyxyqn4vxjy2c",
        derivationMode: "",
        index: 0,
        freshAddress: "osmo10h50supk4en682vrjkc6wkgkpcyxyqn4vxjy2c",
        freshAddressPath: "44'/118'/0'/0/0",
        name: "Osmosis 1 - Nano X",
        balance: "500250",
        spendableBalance: "500250",
        blockHeight: 5417468,
        currencyId: "osmo",
        operationsCount: 2,
        operations: [],
        pendingOperations: [],
        lastSyncDate: "",
      },
      transactions: [
        {
          name: "Same as Recipient",
          transaction: t => ({
            ...t,
            amount: new BigNumber(100),
            recipient: "osmo10h50supk4en682vrjkc6wkgkpcyxyqn4vxjy2c",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "Invalid Address",
          transaction: t => ({
            ...t,
            amount: new BigNumber(100),
            recipient: "dsadasdasdasdas",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "send max",
          transaction: fromTransactionRaw({
            amount: "0",
            recipient: "osmo10c792arqxymu8fghu3dfwsacxdvqd8glh8j30p",
            useAllAmount: true,
            family: "cosmos",
            networkInfo: null,
            fees: null,
            gas: null,
            memo: null,
            mode: "send",
          }) as Transaction,
          expectedStatus: account => {
            if (!isStakingAccount(account)) throw new Error("Should exist because it's osmosis");
            const { stakingResources } = account;
            const totalSpent = account.balance.minus(
              stakingResources.unbondingBalance.plus(stakingResources.delegatedBalance),
            );
            return {
              errors: {},
              warnings: {},
              totalSpent,
            };
          },
        },
        {
          name: "send with memo",
          transaction: fromTransactionRaw({
            amount: "0",
            recipient: "osmo10c792arqxymu8fghu3dfwsacxdvqd8glh8j30p",
            useAllAmount: true,
            family: "cosmos",
            networkInfo: null,
            fees: null,
            gas: null,
            memo: "test",
            mode: "send",
          }) as Transaction,
          expectedStatus: (account, t) => {
            if (!isStakingAccount(account)) throw new Error("Should exist because it's osmosis");
            const { stakingResources } = account;
            invariant(t.memo === "test", "Should have a memo");
            const totalSpent = account.balance.minus(
              stakingResources.unbondingBalance.plus(stakingResources.delegatedBalance),
            );
            return {
              errors: {},
              warnings: {},
              totalSpent,
            };
          },
        },
        {
          name: "Not Enough balance",
          transaction: t => ({
            ...t,
            amount: new BigNumber("99999999999999999"),
            recipient: "osmo10c792arqxymu8fghu3dfwsacxdvqd8glh8j30p",
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Redelegation - success",
          transaction: t => ({
            ...t,
            amount: new BigNumber(100),
            dstValAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
            valAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
            mode: "redelegate",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "redelegation - AmountRequired",
          transaction: t => ({
            ...t,
            mode: "redelegate",
            dstValAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
            valAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "redelegation - Source is Destination",
          transaction: t => ({
            ...t,
            mode: "redelegate",
            dstValAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
            valAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
          }),
          expectedStatus: {
            errors: {
              dstValAddress: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "Unbonding - success",
          transaction: t => ({
            ...t,
            mode: "undelegate",
            valAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "Unbonding - AmountRequired",
          transaction: t => ({
            ...t,
            mode: "undelegate",
            valAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "Delegate - success",
          transaction: t => ({
            ...t,
            mode: "delegate",
            valAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "Delegate - not a valid",
          transaction: t => ({
            ...t,
            mode: "delegate",
            valAddress: "osmo10c792arqxymu8fghu3dfwsacxdvqd8glh8j30p",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
              valAddress: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "ClaimReward - success",
          transaction: t => ({
            ...t,
            valAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
            mode: "claimReward",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "ClaimReward - not a osmovaloper",
          transaction: t => ({
            ...t,
            valAddress: "osmo10c792arqxymu8fghu3dfwsacxdvqd8glh8j30p",
            mode: "claimReward",
          }),
          expectedStatus: {
            errors: {
              valAddress: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "claimRewardCompound - success",
          transaction: t => ({
            ...t,
            valAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
            mode: "compoundReward",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
      ],
    },
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:osmo:osmo1xx72kqjlf2qqj88h0wakwv6rp0v8fwh74z9q89:",
        seedIdentifier: "0283de657d9e283a5c31d64a4c4afbcc48ee79fdd7648bcdde6a1d0d7ae9f9bea1",
        name: "Osmosis 2 - Nano X Static Account",
        derivationMode: "",
        index: 1,
        freshAddress: "osmo1xx72kqjlf2qqj88h0wakwv6rp0v8fwh74z9q89",
        freshAddressPath: "44'/118'/1'/0/0",
        blockHeight: 5417472,
        creationDate: "2022-08-02T16:09:08.906Z",
        operationsCount: 1,
        operations: [],
        pendingOperations: [],
        currencyId: "osmo",
        lastSyncDate: "2022-08-02T16:11:47.343Z",
        balance: "200250",
        spendableBalance: "200250",
        xpub: "osmo1xx72kqjlf2qqj88h0wakwv6rp0v8fwh74z9q89",
        cosmosResources: {
          delegations: [],
          redelegations: [],
          unbondings: [],
          delegatedBalance: "0",
          pendingRewardsBalance: "0",
          unbondingBalance: "0",
          withdrawAddress: "",
        },
      } as AccountRaw,
    },
  ],
};

export default dataset;
