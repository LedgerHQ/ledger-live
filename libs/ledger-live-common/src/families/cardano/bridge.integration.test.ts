import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import BigNumber from "bignumber.js";
import type { DatasetTest } from "../../types";
import { cardanoRawAccount1 } from "./datasets/rawAccount.1";
import { cardanoScanAccounts } from "./datasets/scanAccounts";
import { CardanoMinAmountError } from "./errors";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";

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
          ],
        },
      ],
    },
  },
};

testBridge(dataset);
