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
      <= 2104308656dc38a7ab1f9b5ab966fda3484276fe755da4ecdbcc678e96bf3cb460cf20d22d9a77f5e9459c18ea1d4252c804cfe1eeea1b6521cccb82f3936cdafe932e9000
      => 5b05000015058000002c8000027d800000008000000080000000
      <= 2104474dd8fad13de7ebc82e1cb7ec4e5320887a58010fc484ed5bc8c5ed73fcd8b0208cd5b425f12d780f03a61295f14a113eb4984d5f4849e511582539f51ab0280c9000
      => 5b05000015058000002c8000027d800000018000000080000000
      <= 210432820695b4f7973b278305dc3a1f2d9df91d795b22c811cee46c821b4c91f4cc2059461c565e774cea7ceb138da8fe810bdbd442f6619054a87fe69483c0ce51719000
      => 5b05000015058000002c8000027d800000028000000080000000
      <= 2104c5c84a917f3f8b72a2e8e52ed7bc701fadd6fed638c3fa68c077ccd72773391b20c4fb9828a463809dcaee1965f03071d446658ecf75b3b6932dc122b30c7e2cc09000
      => 5b05000015058000002c8000027d800000038000000080000000
      <= 2104b04acc7b31ed7d49690756383d0f2594bc6053f18456057d29650017514fcdc720de6fccf892eca84c7cd12deb99626e82f1a4515c663a8092dfd2d33a9d15d1409000
      => 5b05000015058000002c8000027d800000048000000080000000
      <= 21045d9a85f25e0bd8bbedd210407072f13a2e5ea7744497571146682b2db3250ff720cf6739cca4963ecf47419f2672766ef1bf06bc470da6b176d8533896956e46a59000
      => 5b05000015058000002c8000027d800000058000000080000000
      <= 2104f08de26904886e3473719972a4e7c8a4fea50b156b33939d0f8d257e8e4d641d2076c1e5b435a59ef558a16d334f7d4f655f873ccfbb1d63fa34d39c58778fbc3a9000
      => 5b05000015058000002c8000027d800000068000000080000000
      <= 210467a4615fd5091b500496f55b9b60efd3c47a79ea1802ac39a1b614f0c2461f43203ace3fed75f6f676299a6f7e31f6829b97391c7a98d54ddb4542869764b210539000
      => 5b05000015058000002c8000027d800000078000000080000000
      <= 21048b01eb387eaa014c6dd95779dadece9250e9d0ef9ddc810e18999da215330dfa20df4e23814cb1db75f0ec09db7e1d1fc338e5604b3cd023e05ba4afa993d53c159000
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
