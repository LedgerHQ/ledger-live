// import { dataset } from "@ledgerhq/coin-aptos/bridge.integration.test";
import { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import "../../__tests__/test-helpers/setup";
import { toSignedOperationRaw } from "../../transaction";
import { fromTransactionRaw } from "./transaction";
import { Transaction } from "./types";

const aptos: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "aptos seed 1",
      apdus: `
      => 5b0500000d038000002c8000027d80000000
      <= 2104308656dc38a7ab1f9b5ab966fda3484276fe755da4ecdbcc678e96bf3cb460cf20d22d9a77f5e9459c18ea1d4252c804cfe1eeea1b6521cccb82f3936cdafe932e9000
      => 5b05000015058000002c8000027d800000008000000080000000
      <= 2104474dd8fad13de7ebc82e1cb7ec4e5320887a58010fc484ed5bc8c5ed73fcd8b0208cd5b425f12d780f03a61295f14a113eb4984d5f4849e511582539f51ab0280c9000
      => 5b05000015058000002c8000027d800000008000000080000000
      <= 2104474dd8fad13de7ebc82e1cb7ec4e5320887a58010fc484ed5bc8c5ed73fcd8b0208cd5b425f12d780f03a61295f14a113eb4984d5f4849e511582539f51ab0280c9000
      => 5b05000015058000002c8000027d800000018000000080000000
      <= 210432820695b4f7973b278305dc3a1f2d9df91d795b22c811cee46c821b4c91f4cc2059461c565e774cea7ceb138da8fe810bdbd442f6619054a87fe69483c0ce51719000
      => 5b05000015058000002c8000027d800000018000000080000000
      <= 210432820695b4f7973b278305dc3a1f2d9df91d795b22c811cee46c821b4c91f4cc2059461c565e774cea7ceb138da8fe810bdbd442f6619054a87fe69483c0ce51719000
      => 5b05000015058000002c8000027d800000028000000080000000
      <= 2104c5c84a917f3f8b72a2e8e52ed7bc701fadd6fed638c3fa68c077ccd72773391b20c4fb9828a463809dcaee1965f03071d446658ecf75b3b6932dc122b30c7e2cc09000
      => 5b05000015058000002c8000027d800000028000000080000000
      <= 2104c5c84a917f3f8b72a2e8e52ed7bc701fadd6fed638c3fa68c077ccd72773391b20c4fb9828a463809dcaee1965f03071d446658ecf75b3b6932dc122b30c7e2cc09000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: "js:2:aptos:32820695b4f7973b278305dc3a1f2d9df91d795b22c811cee46c821b4c91f4cc:",
        seedIdentifier: "308656dc38a7ab1f9b5ab966fda3484276fe755da4ecdbcc678e96bf3cb460cf",
        used: true,
        derivationMode: "",
        index: 1,
        freshAddress: "0x4e5e65d5c7a3191e4310ecd210e8f0ff53823189123b47086d928bd574a573d1",
        freshAddressPath: "44'/637'/1'/0/0",
        blockHeight: 265578715,
        creationDate: "2024-12-10T17:33:27.634Z",
        operationsCount: 2,
        operations: [],
        pendingOperations: [],
        currencyId: "aptos",
        lastSyncDate: "2024-12-16T16:08:47.017Z",
        balance: "20000",
        spendableBalance: "20000",
        balanceHistoryCache: {
          HOUR: {
            balances: [
              0, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
              10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
              10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
              10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 20000, 20000,
              20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
              20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
              20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
              20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
              20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
              20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
              20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
              20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
            ],
            latestDate: 1734364800000,
          },
          DAY: {
            balances: [0, 10000, 10000, 20000, 20000, 20000, 20000],
            latestDate: 1734307200000,
          },
          WEEK: { balances: [0, 20000], latestDate: 1734220800000 },
        },
        xpub: "32820695b4f7973b278305dc3a1f2d9df91d795b22c811cee46c821b4c91f4cc",
        swapHistory: [],
      },
      transactions: [
        {
          name: "NO_NAME",
          transaction: fromTransactionRaw({
            amount: "10000",
            recipient: "0xa0d8abc262e3321f87d745bd5d687e8f3fb14c87d48f840b6b56867df0026ec8",
            useAllAmount: false,
            family: "aptos",
            mode: "send",
            fees: "1100",
            options: '{"maxGasAmount":"11","gasUnitPrice":"100"}',
            estimate:
              '{"maxGasAmount":"11","gasUnitPrice":"100","sequenceNumber":"0","expirationTimestampSecs":"1734365447"}',
            firstEmulation: "false",
            errors: "{}",
          }),
          expectedStatus: () =>
            // you can use account and transaction for smart logic. drop the =>fn otherwise
            ({
              errors: {},
              warnings: {},
              estimatedFees: BigNumber("1100"),
              amount: BigNumber("10000"),
              totalSpent: BigNumber("11100"),
            }),
          // WARNING: DO NOT commit this test publicly unless you're ok with possibility tx could leak out. (do self txs)
          testSignedOperation: (expect, signedOperation) => {
            expect(toSignedOperationRaw(signedOperation)).toMatchObject({
              operation: {
                id: "js:2:aptos:32820695b4f7973b278305dc3a1f2d9df91d795b22c811cee46c821b4c91f4cc:--OUT",
                hash: "",
                type: "OUT",
                senders: ["0x4e5e65d5c7a3191e4310ecd210e8f0ff53823189123b47086d928bd574a573d1"],
                recipients: ["0xa0d8abc262e3321f87d745bd5d687e8f3fb14c87d48f840b6b56867df0026ec8"],
                accountId:
                  "js:2:aptos:32820695b4f7973b278305dc3a1f2d9df91d795b22c811cee46c821b4c91f4cc:",
                blockHash: null,
                blockHeight: null,
                extra: {},
                date: "2024-12-16T16:09:11.918Z",
                value: "11100",
                fee: "1100",
                transactionSequenceNumber: 0,
              },
              signature:
                "4e5e65d5c7a3191e4310ecd210e8f0ff53823189123b47086d928bd574a573d100000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e73010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220a0d8abc262e3321f87d745bd5d687e8f3fb14c87d48f840b6b56867df0026ec80810270000000000000b000000000000006400000000000000075160670000000001002032820695b4f7973b278305dc3a1f2d9df91d795b22c811cee46c821b4c91f4cc4013c5352850e567a1289b38569bdbd2b1229f2bc6ce24083d25e2d56908d263fab1d374486597cd959e02b3cd79d40934099175e835fdff136c6164823e88860c",
            });
          },
          apdus: `
    => 5b06008015058000002c8000027d800000018000000080000000
    <= 9000
    => 5b060180ffb5e97db07fa0bd0e5598aa3643a9bc6f6693bddc1a9fec9e674a461eaa00b1934e5e65d5c7a3191e4310ecd210e8f0ff53823189123b47086d928bd574a573d100000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e740e7472616e736665725f636f696e73010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220a0d8abc262e3321f87d745bd5d687e8f3fb14c87d48f840b6b56867df0026ec80810270000000000000b000000000000006400000000000000075160670000
    <= 9000
    => 5b06020003000001
    <= 4013c5352850e567a1289b38569bdbd2b1229f2bc6ce24083d25e2d56908d263fab1d374486597cd959e02b3cd79d40934099175e835fdff136c6164823e88860c9000
    `,
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
