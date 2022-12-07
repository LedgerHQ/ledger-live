import { NotEnoughBalance } from "@ledgerhq/errors";
import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import BigNumber from "bignumber.js";
import { cardanoRawAccount1 } from "./datasets/rawAccount.1";
import { cardanoScanAccounts } from "./datasets/scanAccounts";
import { CardanoMinAmountError } from "./errors";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";
import type { DatasetTest } from "@ledgerhq/types-live";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    cardano_testnet: {
      scanAccounts: cardanoScanAccounts,
      accounts: [
        {
          raw: cardanoRawAccount1,
          transactions: [
            {
              name: "amount less then minimum",
              transaction: fromTransactionRaw({
                family: "cardano",
                recipient:
                  "addr_test1qpl90kc2jl5kr9tev0s7vays9yhwcdnq8nlylyk4dqsdq3g466elxnxwrzwq72pvp5akenj30t5s9et7frfvrxxx8xcsxrzs87",
                amount: "0.1",
                mode: "send",
              }),
              expectedStatus: {
                amount: new BigNumber("0.1"),
                errors: {
                  amount: new CardanoMinAmountError(),
                },
              },
            },
            {
              name: "token amount more than balance",
              transaction: fromTransactionRaw({
                family: "cardano",
                recipient:
                  "addr_test1qpl90kc2jl5kr9tev0s7vays9yhwcdnq8nlylyk4dqsdq3g466elxnxwrzwq72pvp5akenj30t5s9et7frfvrxxx8xcsxrzs87",
                amount: "101",
                subAccountId:
                  "js:2:cardano_testnet:806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d:cardano+cardano_testnet%2Fnative%2F47be64fcc8a7fe5321b976282ce4e43e4d29015f6613cfabcea28eab54657374",
                mode: "send",
              }),
              expectedStatus: {
                amount: new BigNumber("101"),
                errors: {
                  amount: new NotEnoughBalance(),
                },
              },
            },
            {
              name: "send max token",
              transaction: fromTransactionRaw({
                family: "cardano",
                recipient:
                  "addr_test1qpl90kc2jl5kr9tev0s7vays9yhwcdnq8nlylyk4dqsdq3g466elxnxwrzwq72pvp5akenj30t5s9et7frfvrxxx8xcsxrzs87",
                amount: "0",
                subAccountId:
                  "js:2:cardano_testnet:806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d:cardano+cardano_testnet%2Fnative%2F47be64fcc8a7fe5321b976282ce4e43e4d29015f6613cfabcea28eab54657374",
                mode: "send",
                useAllAmount: true,
              }),
              expectedStatus: {
                amount: new BigNumber("100"),
                totalSpent: new BigNumber("100"),
                errors: {},
                warnings: {},
              },
            },
          ],
        },
      ],
    },
  },
};

testBridge(dataset);
