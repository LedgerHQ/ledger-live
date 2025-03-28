import { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { Transaction } from "../types";

const aptos: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "aptos seed 1",
      apdus: `
      => 5b0500000d038000002c8000027d80000000
      <= 2104d6816f4f22f867b56cf9304b776f452a16d107835d73ee8a33c4ced210300583204bb135642f160c72c323d57ad509b904ff44d9f2b983e8b90468e19b6f431ea79000
      => 5b05000015058000002c8000027d800000008000000080000000
      <= 2104d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956200d8d6cf19a090a8080768d07a848acc333775e5327d2da8a4022301f7dbb88ff9000
      => 5b05000015058000002c8000027d800000018000000080000000
      <= 21046a7712fdac0cb4ed27076c707e7798be52cf6c93a2d43d5cf9b874d0a45a111e208e72477f799c2d3b2899b32b114988ab3d1af02dd0d3562196eccded2936f8449000
      => 5b05000015058000002c8000027d800000028000000080000000
      <= 21048ffc0c2e141ead220f05b30fa01ce9a3783c5a157219f922b02ec194308b1b452084cf4bdff7814f8c3d08bfceb9d2615bf8c6850b208477528f8376c4250e4b5a9000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: "js:2:aptos:d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956:aptos",
        seedIdentifier: "d6816f4f22f867b56cf9304b776f452a16d107835d73ee8a33c4ced210300583",
        used: true,
        derivationMode: "aptos",
        index: 0,
        freshAddress: "0x445fa0013887abd1a0c14acdec6e48090e0ad3fed3e08202aac15ca14f3be26b",
        freshAddressPath: "44'/637'/0'/0'/0'",
        blockHeight: 302459501,
        creationDate: "2024-12-18T12:26:31.070Z",
        operationsCount: 6,
        operations: [],
        pendingOperations: [],
        currencyId: "aptos",
        lastSyncDate: "2025-03-12T10:42:53.570Z",
        balance: "19949100",
        spendableBalance: "19949100",
        balanceHistoryCache: {
          HOUR: {
            balances: [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 19949100, 19949100, 19949100, 19949100, 19949100, 19949100, 19949100, 19949100,
              19949100, 19949100, 19949100, 19949100, 19949100, 19949100, 19949100, 19949100,
              19949100, 19949100,
            ],
            latestDate: 1741773600000,
          },
          DAY: {
            balances: [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              19949100,
            ],
            latestDate: 1741737600000,
          },
          WEEK: { balances: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], latestDate: 1741478400000 },
        },
        xpub: "d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956",
        subAccounts: [
          {
            type: "TokenAccountRaw",
            id: "js:2:aptos:d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
            parentId:
              "js:2:aptos:d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956:aptos",
            tokenId:
              "aptos/coin/dstapt_0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::stakedaptos",
            balance: "30000000",
            spendableBalance: "30000000",
            balanceHistoryCache: {
              HOUR: { latestDate: null, balances: [] },
              DAY: { latestDate: null, balances: [] },
              WEEK: { latestDate: null, balances: [] },
            },
            creationDate: "2025-03-12T10:42:53.570Z",
            operationsCount: 2,
            operations: [],
            pendingOperations: [],
            swapHistory: [],
          },
        ],
        swapHistory: [],
      },
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    aptos,
  },
};
