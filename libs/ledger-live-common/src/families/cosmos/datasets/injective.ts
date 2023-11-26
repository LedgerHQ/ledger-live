import { CurrenciesData } from "@ledgerhq/types-live";
import type { CosmosAccountRaw, Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreOperationFields: ["gas"],
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  scanAccounts: [
    {
      name: "injective seed 1",
      apdus: `
          => 550400001803696e6a2c0000803c000080000000800000000000000000
          <= 03f8e9b05b4de510b0b7d970060eac6a0f76d3c4eb07e11418c0747bc593c91c7d696e6a31686e34367a767834336d7871343776736563767738346b3563686a68756877703664363264749000
          => 550400001803696e6a2c0000803c000080000000800000000000000000
          <= 03f8e9b05b4de510b0b7d970060eac6a0f76d3c4eb07e11418c0747bc593c91c7d696e6a31686e34367a767834336d7871343776736563767738346b3563686a68756877703664363264749000
          => 550400001803696e6a2c0000803c000080010000800000000000000000
          <= 027b5d160be00e600ce13c072899f669527cfcd35795aa3e8c9cbd06ec5f770219696e6a313630347763653974307538766e65307a726a3474327273706a7367323864796d796c6a7a726d9000
          `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:injective:inj1hn46zvx43mxq47vsecvw84k5chjhuhwp6d62dt:",
        seedIdentifier: "03f8e9b05b4de510b0b7d970060eac6a0f76d3c4eb07e11418c0747bc593c91c7d",
        name: "Injective 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "inj1hn46zvx43mxq47vsecvw84k5chjhuhwp6d62dt",
        freshAddressPath: "44'/60'/0'/0/0",
        freshAddresses: [
          {
            address: "inj1hn46zvx43mxq47vsecvw84k5chjhuhwp6d62dt",
            derivationPath: "44'/60'/0'/0/0",
          },
        ],
        blockHeight: 45396242,
        creationDate: "2023-09-18T06:38:17.652Z",
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "injective",
        unitMagnitude: 18,
        lastSyncDate: "2023-09-18T06:38:17.652Z",
        balance: "607564000000000",
        spendableBalance: "506564000000000",
        balanceHistoryCache: {
          HOUR: { balances: [], latestDate: 1695016800000 },
          DAY: { balances: [], latestDate: 1694988000000 },
          WEEK: { balances: [], latestDate: 1694901600000 },
        },
        xpub: "inj1hn46zvx43mxq47vsecvw84k5chjhuhwp6d62dt",
        cosmosResources: {
          delegations: [
            {
              amount: "1000000000000",
              status: "bonded",
              pendingRewards: "2185339433",
              validatorAddress: "injvaloper1hsxaln75wjs033t3spd8a0gawl4jvxawn6v849",
            },
            {
              amount: "100000000000000",
              status: "bonded",
              pendingRewards: "218570386966",
              validatorAddress: "injvaloper1acgud5qpn3frwzjrayqcdsdr9vkl3p6hrz34ts",
            },
          ],
          redelegations: [],
          unbondings: [],
          delegatedBalance: "101000000000000",
          pendingRewardsBalance: "220755726399",
          unbondingBalance: "0",
          withdrawAddress: "inj1hn46zvx43mxq47vsecvw84k5chjhuhwp6d62dt",
          sequence: 2,
        },
        swapHistory: [],
      } as unknown as CosmosAccountRaw,
    },
  ],
};

export default dataset;
