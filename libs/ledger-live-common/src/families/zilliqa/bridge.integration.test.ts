import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { Transaction } from "./types";
import type { DatasetTest } from "@ledgerhq/types-live";
// Needed for transaction: import { BigNumber } from "bignumber.js";
// Needed for transaction: import { fromTransactionRaw } from "./transaction";
// Needed for transaction: import { toSignedOperationRaw } from "../../transaction/signOperation";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    zilliqa: {
      scanAccounts: [
        {
          name: "zilliqa seed 1",
          apdus: `
      => e001000000
      <= 0004029000
      => e00200000c000000800000008000000080
      <= 03fa3bee864530094c637994bd08b45eb1d96e8f3c03e866bc18c7f6b06be15fc77a696c313335796b6e346d683630383077327577773671617436766165646e7170327633706b356571649000
      => e001000000
      <= 0004029000
      => e00200000c010000800000008000000080
      <= 02d0fa63f917e8c6504c8ed9d28669d6fab0137862c81e355af953cb884a463ab87a696c3164746d6b70636c33306566356a66303665377163656c64366a79686a326c70786468726375639000
      => e001000000
      <= 0004029000
      => e00200000c020000800000008000000080
      <= 036c39ae31ef7c4f668a93c0f6343926ab9e635f16fcf6cd30a0ec659d67e7e6f37a696c31676e3732373971363672773538346633717a3675616a7a756b63723576386a666778343232779000
      `,
        },
      ],

      accounts: [
        {
          raw: {
            id: "js:2:zilliqa:zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc:zilliqaL",
            seedIdentifier:
              "03fa3bee864530094c637994bd08b45eb1d96e8f3c03e866bc18c7f6b06be15fc7",
            name: "Zilliqa 2",
            starred: false,
            used: true,
            derivationMode: "zilliqaL",
            index: 1,
            freshAddress: "zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc",
            freshAddressPath: "44'/313'/1'/0'/0'",
            freshAddresses: [
              {
                address: "zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc",
                derivationPath: "44'/313'/1'/0'/0'",
              },
            ],
            blockHeight: 2559763,
            syncHash: undefined,
            creationDate: "2023-01-06T13:03:33.794Z",
            operationsCount: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "zilliqa",
            unitMagnitude: 12,
            lastSyncDate: "2023-01-06T13:03:33.794Z",
            balance: "91870000000000",
            spendableBalance: "91870000000000",

            swapHistory: [],
          },
          transactions: [] /* TODO: [
            {
              name: "NO_NAME",
              transaction: fromTransactionRaw({
                amount: "9000000000000",
                recipient: "zil1cy96fvze76pt7fnuq584lvzen8vkx9upul7ehs",
                useAllAmount: false,
                family: "zilliqa",
                gasPrice: "2000000000",
                gasLimit: "50",
              }),
              expectedStatus: (account, transaction) =>
                // you can use account and transaction for smart logic. drop the =>fn otherwise
                ({
                  errors: {},
                  warnings: {},
                  estimatedFees: BigNumber("100000000000"),
                  amount: BigNumber("9000000000000"),
                  totalSpent: BigNumber("9100000000000"),
                }),
              // WARNING: DO NOT commit this test publicly unless you're ok with possibility tx could leak out. (do self txs)
              testSignedOperation: (expect, signedOperation) => {
                expect(toSignedOperationRaw(signedOperation)).toMatchObject({
                  operation: {
                    id:
                      "js:2:zilliqa:zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc:zilliqaL--OUT",
                    hash: "",
                    type: "OUT",
                    senders: ["zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc"],
                    recipients: ["zil1cy96fvze76pt7fnuq584lvzen8vkx9upul7ehs"],
                    accountId:
                      "js:2:zilliqa:zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc:zilliqaL",
                    blockHash: null,
                    blockHeight: "2559763",
                    extra: { amount: "9000000000000" },
                    date: "2023-01-09T15:28:04.621Z",
                    value: "9100000000000",
                    fee: "100000000000",
                    transactionSequenceNumber: 8,
                  },
                  signature:
                    "0881800410081a14c10ba4b059f682bf267c050f5fb05999d963178122230a2102d0fa63f917e8c6504c8ed9d28669d6fab0137862c81e355af953cb884a463ab82a120a1000000000000000000000082f79cd900032120a10000000000000000000000000773594003832:878c5f507a8110665cf7cd1ce3ee09e5ff91ed0b3f88401301d647c779ea33af5cab67a4243793cbab2d2f1b07638a2cdfa195c62df4dab37a8a64fc5afb486d",
                  expirationDate: null,
                });
              },
              apdus: `
  => e001000000
  <= 0004029000
  => e00400001c010000805b000000100000000881800410081a14c10ba4b059f682bf
  <= 9000
  => e0040000184b00000010000000267c050f5fb05999d963178122230a21
  <= 9000
  => e0040000183b0000001000000002d0fa63f917e8c6504c8ed9d28669d6
  <= 9000
  => e0040000182b00000010000000fab0137862c81e355af953cb884a463a
  <= 9000
  => e0040000181b00000010000000b82a120a100000000000000000000008
  <= 9000
  => e0040000180b000000100000002f79cd900032120a1000000000000000
  <= 9000
  => e004000013000000000b0000000000000000773594003832
  <= 878c5f507a8110665cf7cd1ce3ee09e5ff91ed0b3f88401301d647c779ea33af5cab67a4243793cbab2d2f1b07638a2cdfa195c62df4dab37a8a64fc5afb486d9000
  `,
            },
          ],*/,
        },
      ],
    },
  },
};

testBridge(dataset);
