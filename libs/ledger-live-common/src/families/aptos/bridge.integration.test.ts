import { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import "../../__tests__/test-helpers/setup";
import { fromTransactionRaw } from "./transaction";
import { Transaction } from "./types";

const aptos: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "aptos seed 1",
      apdus: `
      => 5b0500000d038000002c8000027d80000000
      <= 2104d6816f4f22f867b56cf9304b776f452a16d107835d73ee8a33c4ced210300583204bb135642f160c72c323d57ad509b904ff44d9f2b983e8b90468e19b6f431ea79000
      => 5b05000015058000002c8000027d800000008000000080000000
      <= 2104d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956200d8d6cf19a090a8080768d07a848acc333775e5327d2da8a4022301f7dbb88ff9000
      => 5b05000015058000002c8000027d800000008000000080000000
      <= 2104d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956200d8d6cf19a090a8080768d07a848acc333775e5327d2da8a4022301f7dbb88ff9000
      => 5b05000015058000002c8000027d800000018000000080000000
      <= 21046a7712fdac0cb4ed27076c707e7798be52cf6c93a2d43d5cf9b874d0a45a111e208e72477f799c2d3b2899b32b114988ab3d1af02dd0d3562196eccded2936f8449000
      => 5b05000015058000002c8000027d800000018000000080000000
      <= 21046a7712fdac0cb4ed27076c707e7798be52cf6c93a2d43d5cf9b874d0a45a111e208e72477f799c2d3b2899b32b114988ab3d1af02dd0d3562196eccded2936f8449000
      => 5b05000015058000002c8000027d800000028000000080000000
      <= 21048ffc0c2e141ead220f05b30fa01ce9a3783c5a157219f922b02ec194308b1b452084cf4bdff7814f8c3d08bfceb9d2615bf8c6850b208477528f8376c4250e4b5a9000
      => 5b05000015058000002c8000027d800000028000000080000000
      <= 21048ffc0c2e141ead220f05b30fa01ce9a3783c5a157219f922b02ec194308b1b452084cf4bdff7814f8c3d08bfceb9d2615bf8c6850b208477528f8376c4250e4b5a9000
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
            //options: '{ "maxGasAmount": "11", "gasUnitPrice": "100" }',
            estimate:
              '{ "maxGasAmount": "11", "gasUnitPrice": "100", "sequenceNumber": "1", "expirationTimestampSecs": "1734535375" }',
            firstEmulation: "false",
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

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    aptos,
  },
};

testBridge(dataset);
