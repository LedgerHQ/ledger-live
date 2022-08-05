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
                amount: "5000000001",
                subAccountId:
                  "js:2:cardano_testnet:a902bc61a79256e1d5858d2ba49cab7011a26ad49580daace7412e255e818b1c1eba2defa321ff2937deba397f639f5bbabb0f0064516301fa4d08663c83f5b2:+cardano_testnet%2Fnative%2F581684861359b6d4d00594073a9aa4223c6fc24d24da05e1b34fb865544553545f544f4b454e",
                mode: "send",
              }),
              expectedStatus: {
                amount: new BigNumber("5000000001"),
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
                  "js:2:cardano_testnet:a902bc61a79256e1d5858d2ba49cab7011a26ad49580daace7412e255e818b1c1eba2defa321ff2937deba397f639f5bbabb0f0064516301fa4d08663c83f5b2:+cardano_testnet%2Fnative%2F581684861359b6d4d00594073a9aa4223c6fc24d24da05e1b34fb865544553545f544f4b454e",
                mode: "send",
                useAllAmount: true,
              }),
              expectedStatus: {
                amount: new BigNumber("5000000000"),
                totalSpent: new BigNumber("5000000000"),
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
