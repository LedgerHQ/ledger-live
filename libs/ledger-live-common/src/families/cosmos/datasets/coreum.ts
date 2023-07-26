import { CurrenciesData } from "@ledgerhq/types-live";
import type { CosmosAccountRaw, Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreOperationFields: ["gas"],
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  scanAccounts: [
    {
      name: "coreum seed 1",
      apdus: `
      => 550400001904636f72652c00008076000080000000800000000000000000
      <= 03633639c689420031c73c1157975ea734e22eae588045a96fc9495d28aba3f0d1636f726531306c366833717730357537716475716761666a38776c727833666a68723835327a3772356c329000
      => 550400001904636f72652c00008076000080000000800000000000000000
      <= 03633639c689420031c73c1157975ea734e22eae588045a96fc9495d28aba3f0d1636f726531306c366833717730357537716475716761666a38776c727833666a68723835327a3772356c329000
      => 550400001904636f72652c00008076000080010000800000000000000000
      <= 03da7e01e4a9c30aecb7574bda681dd021745f9982b3644b7733628f7579c8c310636f72653173656c3979733861376a6c736d727870393639327a666a6e636e6d68786b77733071723367399000
      => 550400001904636f72652c00008076000080020000800000000000000000
      <= 0209796438379822529674761b7a65e7b0262ba571a8bc8b1786ef942622b73bc7636f7265316d646a366a38396576347966656c76336b716e3770726a346839326572357a6c78737378776b9000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:coreum:core1sel9ys8a7jlsmrxp9692zfjncnmhxkws0qr3g9:",
        seedIdentifier: "03633639c689420031c73c1157975ea734e22eae588045a96fc9495d28aba3f0d1",
        name: "Coreum 2",
        starred: false,
        used: true,
        derivationMode: "",
        index: 1,
        freshAddress: "core1sel9ys8a7jlsmrxp9692zfjncnmhxkws0qr3g9",
        freshAddressPath: "44'/118'/1'/0/0",
        freshAddresses: [
          {
            address: "core1sel9ys8a7jlsmrxp9692zfjncnmhxkws0qr3g9",
            derivationPath: "44'/118'/1'/0/0",
          },
        ],
        blockHeight: 6313741,
        creationDate: "2023-07-26T02:02:57.000Z",
        operationsCount: 1,
        operations: [
          {
            id: "js:2:coreum:core1sel9ys8a7jlsmrxp9692zfjncnmhxkws0qr3g9:-0B17FF19A1E8DC703A3AEC457B414DE88845DD76BB4D95F8F6368F68D59248DF-IN",
            hash: "0B17FF19A1E8DC703A3AEC457B414DE88845DD76BB4D95F8F6368F68D59248DF",
            type: "IN",
            senders: ["core10l6h3qw05u7qduqgafj8wlrx3fjhr852z7r5l2"],
            recipients: ["core1sel9ys8a7jlsmrxp9692zfjncnmhxkws0qr3g9"],
            accountId: "js:2:coreum:core1sel9ys8a7jlsmrxp9692zfjncnmhxkws0qr3g9:",
            blockHash: null,
            blockHeight: "6306437",
            extra: {
              validators: [],
              memo: "lb",
            },
            date: "2023-07-26T02:02:57.000Z",
            value: "1000000",
            fee: "8880",
            transactionSequenceNumber: 0,
          },
        ],
        pendingOperations: [],
        currencyId: "coreum",
        unitMagnitude: 6,
        lastSyncDate: "2023-07-26T05:46:40.684Z",
        balance: "1000000",
        spendableBalance: "1000000",
        balanceHistoryCache: {
          HOUR: {
            balances: [0, 1000000, 1000000, 1000000],
            latestDate: 1690347600000,
          },
          DAY: {
            balances: [0],
            latestDate: 1690322400000,
          },
          WEEK: {
            balances: [0],
            latestDate: 1690063200000,
          },
        },
        xpub: "core1sel9ys8a7jlsmrxp9692zfjncnmhxkws0qr3g9",
        cosmosResources: {
          delegations: [],
          redelegations: [],
          unbondings: [],
          delegatedBalance: "0",
          pendingRewardsBalance: "0",
          unbondingBalance: "0",
          withdrawAddress: "core1sel9ys8a7jlsmrxp9692zfjncnmhxkws0qr3g9",
        },
        swapHistory: [],
      } as unknown as CosmosAccountRaw,
    },
  ],
};

export default dataset;
