import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import {
  NotEnoughBalance,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
} from "@ledgerhq/errors";

import { fromTransactionRaw } from "./transaction";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const hedera: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "hedera seed 1",
      apdus: `
          => e002010009000000002c00000bd6
          <= 9e92a312233d5fd6b5a723875aeea2cea81a8e48ffc00341cff6dffcfd3ab7f29000
          `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:hedera:0.0.751515:`,
        seedIdentifier: "",
        name: "Hedera 1",
        derivationMode: "hederaBip44",
        index: 0,
        freshAddress: "0.0.751515",
        freshAddressPath: "44/3030/0/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "hedera",
        unitMagnitude: 8,
        lastSyncDate: "",
        balance: "0",
      },
      transactions: [
        {
          name: "Recipient and sender must not be the same",
          transaction: fromTransactionRaw({
            family: "hedera",
            recipient: "0.0.751515",
            amount: "100000000",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount Required",
          transaction: fromTransactionRaw({
            family: "hedera",
            recipient: "0.0.751515",
            amount: "0",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance",
          transaction: fromTransactionRaw({
            family: "hedera",
            recipient: "0.0.751515",
            amount: "1000000000000000",
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
            family: "hedera",
            recipient: "0.0.751515",
            amount: "1000000000000000",
            useAllAmount: true,
          }),
          expectedStatus: (account, _, status) => {
            return {
              amount: account.balance.minus(status.estimatedFees),
              errors: {},
              warnings: {},
            };
          },
        },
      ],
    },
  ],
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    hedera,
  },
};

testBridge(dataset);
