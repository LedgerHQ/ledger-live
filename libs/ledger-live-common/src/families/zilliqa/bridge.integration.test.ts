import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { Transaction } from "./types";
import type { DatasetTest } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { fromTransactionRaw } from "./transaction";
import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  InvalidAddress,
} from "@ledgerhq/errors";
// Needed for transaction: import { toSignedOperationRaw } from "../../transaction/signOperation";

const TEST_ADDRESS = "zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc";
const TEST_RECV_ADDRESS = "zil135ykn4mh6080w2uww6qat6vaednqp2v3pk5eqd";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    zilliqa: {
      scanAccounts: [
        {
          name: "zilliqa seed 1",
          apdus: `
      => e001000000
      <= 0004049000
      => e00200000400000080
      <= 03fa3bee864530094c637994bd08b45eb1d96e8f3c03e866bc18c7f6b06be15fc77a696c313335796b6e346d683630383077327577773671617436766165646e7170327633706b356571649000
      => e001000000
      <= 0004049000
      => e00200000401000080
      <= 02d0fa63f917e8c6504c8ed9d28669d6fab0137862c81e355af953cb884a463ab87a696c3164746d6b70636c33306566356a66303665377163656c64366a79686a326c70786468726375639000
      => e001000000
      <= 0004049000
      => e00200000402000080
      <= 036c39ae31ef7c4f668a93c0f6343926ab9e635f16fcf6cd30a0ec659d67e7e6f37a696c31676e3732373971363672773538346633717a3675616a7a756b63723576386a666778343232779000
      => e001000000
      <= 0004049000
      => e00200000403000080
      <= 03055443a4ed8692350ee874dc2718b13ec90bb9d069a2aeeb6e8d7baab65382e87a696c31766b6a787667676d61356534733861763634676b7635743461357a7a6368757a6739647278379000
      => e001000000
      <= 0004049000
      => e00200000404000080
      <= 036d05ebad3cbe812a13eb75753be60d9573a14dd6b8f58798b2b50b1b6cc5c9797a696c31617766343332653765736b726c323978796677636166393766706433636d35636434393568749000
      => e001000000
      <= 0004049000
      => e00200000405000080
      <= 0382b45abf88430c5f3553fc6140976de9a539968d7fd1ec98e290c7b7167490747a696c3138787170707a356b353564646a6575373034787877386d72706c7636393063326832393370379000
      => e001000000
      <= 0004049000
      => e00200000406000080
      <= 02f7a69301d7d402c4ccbefba3c2546cfaa36384ce6db6ba1208b935fd1dfeeb037a696c313367616330336e336865306a6b65306774383777706e6c766c6a38363976756e64346468746b9000
      => e001000000
      <= 0004049000
      => e00200000407000080
      <= 03b4c7677f1d2299ee2dec6ba255c0312972137e0f940b32be6bc7902f11824f857a696c3165777934707a7472676d326374367373723930653334377136657a6c6b706b6739666d6c686d9000
      => e001000000
      <= 0004049000
      => e00200000408000080
      <= 02e0f281a2d9f5cf374c30ae0455984b626bd5604bad178e437692c2a998a74c927a696c3134783038667567613933636d7230646c7473766e6533743867703737763870736471676c67769000
      `,
        },
      ],

      accounts: [
        {
          raw: {
            id: `js:2:zilliqa:${TEST_ADDRESS}:zilliqaL`,
            seedIdentifier:
              "03fa3bee864530094c637994bd08b45eb1d96e8f3c03e866bc18c7f6b06be15fc7",
            name: "Zilliqa 2",
            starred: false,
            used: true,
            derivationMode: "zilliqaL",
            index: 1,
            freshAddress: `${TEST_ADDRESS}`,
            freshAddressPath: "44'/313'/1'/0'/0'",
            freshAddresses: [
              {
                address: `${TEST_ADDRESS}`,
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
          transactions: [
            {
              name: "recipient and sender must not be the same",
              transaction: fromTransactionRaw({
                family: "zilliqa",
                recipient: `${TEST_ADDRESS}`,
                amount: "100000000",
              }),
              expectedStatus: {
                amount: new BigNumber("100000000"),
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
              },
            },
            {
              name: "Not a valid address",
              transaction: fromTransactionRaw({
                family: "zilliqa",
                recipient: "zilliqa_invalid_addr",
                amount: "100000000",
              }),
              expectedStatus: {
                errors: {
                  recipient: new InvalidAddress(),
                },
                warnings: {},
              },
            },
            {
              name: "Not enough balance",
              transaction: fromTransactionRaw({
                family: "zilliqa",
                recipient: `${TEST_RECV_ADDRESS}`,
                amount: "1000000000000000000000000",
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
            {
              name: "Send max",
              transaction: fromTransactionRaw({
                family: "zilliqa",
                recipient: `${TEST_RECV_ADDRESS}`,
                useAllAmount: true,
                amount: "0",
              }),
              expectedStatus: (account, _, status) => {
                return {
                  amount: account.balance.minus(status.estimatedFees),
                  warnings: {},
                  errors: {},
                };
              },
            },
          ],
        },
      ],
    },
  },
};

testBridge(dataset);
