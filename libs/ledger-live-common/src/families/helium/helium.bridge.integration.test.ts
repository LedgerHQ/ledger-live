import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { DatasetTest } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import type { Transaction } from "./types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    helium: {
      scanAccounts: [
        {
          name: "helium seed 1",
          apdus: `
          => e00200000d038000002c8000038880000000
          <= 000141fd43c78e228b8995002cf92cb40749cdc284d9cd14eba86ac26f8688333cc205b19d0b9000
          => e002000015058000002c80000388800000008000000080000000
          <= 000141fd43c78e228b8995002cf92cb40749cdc284d9cd14eba86ac26f8688333cc205b19d0b9000
          => e002000115058000002c80000388800000018000000080000000
          <= 0001b0e74eb51de315e201a8bc9a9521dc7fb1c13545a8edecbda113b0db6207fd757cac4c4b9000
          `,
        },
      ],
      FIXME_ignorePreloadFields: ["votes"],
      accounts: [
        {
          FIXME_tests: ["balance is sum of ops"],
          raw: {
            id: `js:2:helium:13DTKSEQYRfMgUHXFzgWqUKqokcpd2E4XBF9whPWXJZmT8iBw6N:helium`,
            seedIdentifier: `23ab82f57f7ab4f19097c1a118df91afc5077954d6a012e0086a418ba1559038`,
            name: "Helium 1",
            derivationMode: "helium",
            index: 0,
            freshAddress: "13DTKSEQYRfMgUHXFzgWqUKqokcpd2E4XBF9whPWXJZmT8iBw6N",
            freshAddressPath: "44'/904'/0'/0'/0'",
            freshAddresses: [
              {
                address: "13DTKSEQYRfMgUHXFzgWqUKqokcpd2E4XBF9whPWXJZmT8iBw6N",
                derivationPath: "44'/904'/0'/0'/0'",
              },
            ],
            blockHeight: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "helium",
            unitMagnitude: 8,
            lastSyncDate: "",
            balance: "102815201",
          },
          transactions: [
            // HERE WE WILL INSERT OUR test
            {
              name: "Same as Recipient",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "13DTKSEQYRfMgUHXFzgWqUKqokcpd2E4XBF9whPWXJZmT8iBw6N",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
              },
            },
            {
              name: "send",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("1000"),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
              },
            },
            {
              name: "send amount more than fees + base reserve",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance.plus(1000),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
            {
              name: "send more than base reserve",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance.plus("100"),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
            {
              name: "send Token",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("1000"),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
                amount: new BigNumber("1000"),
              },
            },
            {
              name: "send Token - more than available",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("999999999999999999"),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
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
