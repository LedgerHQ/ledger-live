import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { DatasetTest } from "@ledgerhq/types-live";
import type { NervosAccountRaw, Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import { toSignedOperationRaw } from "../../transaction";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    nervos: {
      scanAccounts: [
        {
          name: "nervos seed 1",
          apdus: `
          => 800200000d038000002c8000013580000000
          <= 41049cfaff90e8906e8b5e5847448908164755de4f0e9aa5b9e56eb593fdffcf7d700c6d685c1a62518bd2fcad1a1b8244f7c8dd9cb6b7c49f69a80cf9156b6c31fe9000
          => 8002000015058000002c80000135800000000000000000000000
          <= 4104b395951a926ada69cba5f771b81eea192667d96564562a1237ac392d3489613cfcb19c29f014f0e01960a46531ae09312159d273238d989831beec9afd3e02429000
          => 800400000d038000002c8000013580000000
          <= 41049cfaff90e8906e8b5e5847448908164755de4f0e9aa5b9e56eb593fdffcf7d700c6d685c1a62518bd2fcad1a1b8244f7c8dd9cb6b7c49f69a80cf9156b6c31fe201585286d11843f7c51051fa6a2dfa227e50e30080b04478635edee4b83386ca19000
          => 8002000015058000002c80000135800000010000000000000000
          <= 4104be4251638b6971fa35fd0b772e75c6a1f65a116fcfaf441ac83ab4d9a4a5ec80c02c95da1aeada9335228018be78f29c81f62808250bd3f6bdb8344882e4203d9000
          => 800400000d038000002c8000013580000001
          <= 410413132135797c882c8bf153cbd166cc85b4c6d4c6ed33870b15add3534f52ed9b53f989aea0b4fa3514283894c18916a7058bafe29a6ac7a4cf9bfae8cb5e6f5d208eb3fb7c5e682a17f3f8a4f2cb9ed2cc330988e9213f77ac815f948a2c3051e99000
          `,
        },
      ],
      accounts: [
        {
          raw: {
            id: "js:2:nervos:0x029cfaff90e8906e8b5e5847448908164755de4f0e9aa5b9e56eb593fdffcf7d70_0x1585286d11843f7c51051fa6a2dfa227e50e30080b04478635edee4b83386ca1:",
            seedIdentifier:
              "0x029cfaff90e8906e8b5e5847448908164755de4f0e9aa5b9e56eb593fdffcf7d70",
            name: "Nervos 1",
            derivationMode: "",
            index: 0,
            freshAddress:
              "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqd60ku4w9k6wee56k22wnu74ynj63wk48qg6kycj",
            freshAddressPath: "44'/309'/0'/0/8",
            freshAddresses: [
              {
                address:
                  "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2lnue7l74n5dl6wxn69lc2cqwtujxxa4gh0r0u6",
                derivationPath: "44'/309'/0'/0/0",
              },
            ],
            blockHeight: 8428212,
            creationDate: "2022-10-07T20:54:33.058Z",
            operationsCount: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "nervos",
            unitMagnitude: 8,
            lastSyncDate: "2022-11-07T19:04:59.174Z",
            balance: "7999999536",
            spendableBalance: "7999999536",
            xpub: "0x029cfaff90e8906e8b5e5847448908164755de4f0e9aa5b9e56eb593fdffcf7d70_0x1585286d11843f7c51051fa6a2dfa227e50e30080b04478635edee4b83386ca1",
            swapHistory: [],
          } as NervosAccountRaw,
          transactions: [
            {
              name: "on CKB send",
              transaction: fromTransactionRaw({
                amount: "7000000000",
                recipient:
                  "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvldghegh2j2084rhnvgppfj9urgtln7zqf2lp00",
                useAllAmount: false,
                family: "nervos",
                mode: "SendCKB",
                feePerByte: "1",
              }),
              testSignedOperation: (expect, signedOperation) => {
                expect(toSignedOperationRaw(signedOperation)).toMatchObject({
                  operation: {
                    id: "js:2:nervos:0x029cfaff90e8906e8b5e5847448908164755de4f0e9aa5b9e56eb593fdffcf7d70_0x1585286d11843f7c51051fa6a2dfa227e50e30080b04478635edee4b83386ca1:-0xdc937cab190b1963b17edfc17f16d38c5a491151631336366ef008759ed4eeaa-OUT",
                    hash: "0xdc937cab190b1963b17edfc17f16d38c5a491151631336366ef008759ed4eeaa",
                    type: "OUT",
                    senders: [
                      "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgsgfkw9xvnqpupunc25kcjt9dt48lm89gyljg0n",
                    ],
                    recipients: [
                      "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvldghegh2j2084rhnvgppfj9urgtln7zqf2lp00",
                    ],
                    accountId:
                      "js:2:nervos:0x029cfaff90e8906e8b5e5847448908164755de4f0e9aa5b9e56eb593fdffcf7d70_0x1585286d11843f7c51051fa6a2dfa227e50e30080b04478635edee4b83386ca1:",
                    blockHash: null,
                    blockHeight: null,
                    extra: {},
                    value: "7999999536",
                    fee: "355",
                  },
                  signature:
                    '{"version":"0x0","cellDeps":[{"outPoint":{"txHash":"0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c","index":"0x0"},"depType":"depGroup"}],"headerDeps":[],"inputs":[{"previousOutput":{"txHash":"0x704a13f16dd0a8a83ca6afb5c1129c21f58fadb6613084c563eb1c36714ecf2c","index":"0x1"},"since":"0x0"}],"outputs":[{"capacity":"0x1dcd64ccd","lock":{"codeHash":"0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8","hashType":"type","args":"0x9f6a2f945d5253cf51de6c404299178342ff3f08"}}],"witnesses":["0x5500000010000000550000005500000041000000aa4066313956cca4ba058b9addd64631ae3bff302f45221dc833630360d158a25a4a2532515e41d416cc980fe5b731690d0c7810d9cb746f88a874f4f633bcec01"],"outputsData":["0x"]}',
                  expirationDate: null,
                });
              },
              apdus: `
              => 80030000e60e0300001800000030000000480000004c000000ad020000050000002c00008035010080000000800100000001000000050000002c0000803501008000000080010000000200000001000000610200001c00000020000000490000004d000000ec01000055020000000000000100000071a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c0000000001000000009f01000008000000970100000c000000380000000000000000000000704a13f16dd0a8a83ca6afb5c1129c21f58fadb6613084c563eb1c36714ecf2c010000005f0100001c0000002000000049
              <= 9000
              => 80030100e60000004d0000007d0000004b010000000000000100000071a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c00000000010000000001000000000000000000000046451eb0d4479c84624fcc86233bbfc0be896b804f325613f430264959cc3f0a00000000ce0000000c0000006d0000006100000010000000180000006100000000863ba101000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000c4b50c5c8d074f063ec0a77ded0eaff0fa7b65da610000001000000018
              <= 9000
              => 80030100e600000061000000304ed6dc01000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8011400000010426ce2999300781e4f0aa5b12595aba9ffb395140000000c000000100000000000000000000000690000000800000061000000100000001800000061000000cd4cd6dc01000000490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801140000009f6a2f945d5253cf51de6c404299178342ff3f080c00000008000000000000006100000008
              <= 9000
              => 800381005c0000005500000055000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
              <= aa4066313956cca4ba058b9addd64631ae3bff302f45221dc833630360d158a25a4a2532515e41d416cc980fe5b731690d0c7810d9cb746f88a874f4f633bcec019000
              `,
            },
          ],
        },
        {
          raw: {
            id: "js:2:nervos:0x0313132135797c882c8bf153cbd166cc85b4c6d4c6ed33870b15add3534f52ed9b_0x8eb3fb7c5e682a17f3f8a4f2cb9ed2cc330988e9213f77ac815f948a2c3051e9:",
            seedIdentifier:
              "0x029cfaff90e8906e8b5e5847448908164755de4f0e9aa5b9e56eb593fdffcf7d70",
            name: "Nervos 2",
            derivationMode: "",
            index: 1,
            freshAddress:
              "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvldghegh2j2084rhnvgppfj9urgtln7zqf2lp00",
            freshAddressPath: "44'/309'/1'/0/0",
            freshAddresses: [
              {
                address:
                  "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvldghegh2j2084rhnvgppfj9urgtln7zqf2lp00",
                derivationPath: "44'/309'/1'/0/0",
              },
            ],
            pendingOperations: [],
            operations: [],
            currencyId: "nervos",
            unitMagnitude: 8,
            balance: "0",
            spendableBalance: "0",
            blockHeight: 8427999,
            lastSyncDate: "",
            xpub: "0x0313132135797c882c8bf153cbd166cc85b4c6d4c6ed33870b15add3534f52ed9b_0x8eb3fb7c5e682a17f3f8a4f2cb9ed2cc330988e9213f77ac815f948a2c3051e9",
          } as NervosAccountRaw,
          transactions: [],
        },
      ],
    },
  },
};

testBridge(dataset);
