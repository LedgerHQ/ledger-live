import { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fromTransactionRaw } from "../bridge/transaction";
import { Transaction } from "../types";

const aptos: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "aptos seed 1",
      apdus: `
      => 5b0500000d038000002c8000027d80000000
      <= 210430cfd94a543eca9ba9d26eafe07f6c28e1e43e4768f3c0bad32efeced8662f8720b44227ab88ddefa2ff5deb5e366c70e8b703aec381de39b103dd50eabf8d9d119000
      => 5b05000015058000002c8000027d800000008000000080000000
      <= 21044b16bdc2f72ea4502a8c4879c72e71d4d1a8ec46c43620e00a6f46e0b7569c6b20ba21e074c2bd6b307a35c85afd6ad40dc8319af9ec11660c588ffd3e413773259000
      => 5b05000015058000002c8000027d800000018000000080000000
      <= 21049aec773c4b645bba274924e2e8aeea525ba37051c94bfd922b60c87b1692091e207fa1d1caa1209d35fafe59393bc820bb7b0b81f3a808dd3728e0b1347bfff40e9000
      => 5b05000015058000002c8000027d800000028000000080000000
      <= 21041fb77263c646810574525025561e4559c338b571f57f1b513d75b1609d5fa5f6205e9117d152b467fac631d742ddbc31ea3cbcaac51273c1e931058a56e983d9f59000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: "js:2:aptos:d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956:",
        seedIdentifier: "d6816f4f22f867b56cf9304b776f452a16d107835d73ee8a33c4ced210300583",
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "0x445fa0013887abd1a0c14acdec6e48090e0ad3fed3e08202aac15ca14f3be26b",
        freshAddressPath: "44'/637'/0'/0/0",
        blockHeight: 266360751,
        creationDate: "2024-12-18T12:26:31.070Z",
        operationsCount: 5,
        operations: [],
        pendingOperations: [],
        currencyId: "aptos",
        lastSyncDate: "2024-12-18T15:20:55.097Z",
        balance: "30100",
        spendableBalance: "30100",
        balanceHistoryCache: {
          HOUR: { balances: [0, 50000, 50000, 30100], latestDate: 1734534000000 },
          DAY: { balances: [0], latestDate: 1734480000000 },
          WEEK: { balances: [0], latestDate: 1734220800000 },
        },
        xpub: "d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956",
        swapHistory: [],
      },
      transactions: [
        {
          name: "NO_NAME",
          transaction: fromTransactionRaw({
            amount: "20000",
            recipient: "0xd20fa44192f94ba086ab16bfdf57e43ff118ada69b4c66fa9b9a9223cbc068c1",
            useAllAmount: false,
            family: "aptos",
            mode: "send",
            fees: "1100",
            options: '{ "maxGasAmount": "11", "gasUnitPrice": "100" }',
            errors: "{}",
          }),
          expectedStatus: () =>
            // you can use account and transaction for smart logic. drop the =>fn otherwise
            ({
              errors: {},
              warnings: {},
              estimatedFees: BigNumber("900"),
              amount: BigNumber("20000"),
              totalSpent: BigNumber("20900"),
            }),
        },
      ],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    aptos,
  },
};
