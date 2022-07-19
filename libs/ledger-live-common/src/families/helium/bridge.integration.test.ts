import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { DatasetTest } from "../../types";
import { BigNumber } from "bignumber.js";
import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
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
          <= 000123ab82f57f7ab4f19097c1a118df91afc5077954d6a012e0086a418ba15590389000
          => e002000015058000002c80000388800000008000000080000000
          <= 000123ab82f57f7ab4f19097c1a118df91afc5077954d6a012e0086a418ba15590389000
          `,
        },
      ],
      accounts: [
        {
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
            unitMagnitude: 10,
            lastSyncDate: "",
            balance: "2111000",
          },
          transactions: [
            // HERE WE WILL INSERT OUR test
            {
              name: "Same as Recipient",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q",
              }),
              expectedStatus: {
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
              },
            },
            {
              name: "Account creation minimum amount too low",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100"),
                recipient:
                  "MVE6C3XB4JBKXKORC3NLAWFW4M7EY3MADU6L72DADFP4NZBJIAYXGSLN3Y",
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalanceBecauseDestinationNotCreated(),
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
                  "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI",
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
                amount: account.balance,
                recipient:
                  "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI",
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
                amount: account.balance.minus("100"),
                recipient:
                  "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI",
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
                subAccountId:
                  "js:1:algorand:c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c4:+312769",
                amount: new BigNumber("1000"),
                recipient:
                  "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI",
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
                subAccountId:
                  "js:1:algorand:c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c4:+312769",
                amount: new BigNumber("100000000000"),
                recipient:
                  "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI",
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
