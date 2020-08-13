// @flow

import { BigNumber } from "bignumber.js";
import type { DatasetTest } from "../../__tests__/test-helpers/bridge";
import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import type { Transaction } from "./types";

// const notCreatedAlgorandAddress =
//   "ZBILW5BPM7AQU54YQZICSGS4J7KJ2XV6OC3DFUQ7BB4DVLYKKUEVWDDBGM";

const dataset: DatasetTest<Transaction> = {
  implementations: ["libcore"],
  currencies: {
    algorand: {
      FIXME_ignoreAccountFields: [
        "algorandResources.rewards", // We cant keep track of this since it's always move
        "algorandResources.rewardsAccumulated", // same
        "balance", // I think rewards are included
        "spendableBalance", // same since the rewards are included here
      ],
      scanAccounts: [
        {
          name: "algorand seed 1",
          apdus: `
          => 800300000400000000
          <= fef9cf3252121f000324dd819b2c1d76910413924acaf6779b30e1fa1874d7af9000
          => 800300000480000000
          <= fef9cf3252121f000324dd819b2c1d76910413924acaf6779b30e1fa1874d7af9000
          => 800300000480000001
          <= c5b2f1897dbc1e279837507ea01bf82ea0611897dff13933bd13c8f3a9a4d6649000
          => 800300000480000002
          <= 997011869f890d99597a22a364e9f085a649eba1847580e405de81838683ce3f9000
          `,
        },
      ],
      accounts: [
        {
          FIXME_tests: ["balance is sum of ops"], // Rewards issues
          raw: {
            id:
              "libcore:1:algorand:fef9cf3252121f000324dd819b2c1d76910413924acaf6779b30e1fa1874d7af:",
            seedIdentifier:
              "fef9cf3252121f000324dd819b2c1d76910413924acaf6779b30e1fa1874d7af",
            name: "Algorand 1",
            xpub:
              "fef9cf3252121f000324dd819b2c1d76910413924acaf6779b30e1fa1874d7af",
            derivationMode: "",
            index: 0,
            freshAddress:
              "73446MSSCIPQAAZE3WAZWLA5O2IQIE4SJLFPM543GDQ7UGDU26XZFA6O64",
            freshAddressPath: "44'/283'/0'/0/0",
            freshAddresses: [
              {
                address:
                  "73446MSSCIPQAAZE3WAZWLA5O2IQIE4SJLFPM543GDQ7UGDU26XZFA6O64",
                derivationPath: "44'/283'/0'/0/0",
              },
            ],
            unitMagnitude: 6,
            blockHeight: 8019708,
            operations: [],
            pendingOperations: [],
            currencyId: "algorand",
            lastSyncDate: "",
            balance: "59186008",
            spendableBalance: "59186008",
            subAccounts: [],
          },
          transactions: [
            {
              name: "Same as Recipient",
              transaction: (t) => ({
                ...t,
                amount: BigNumber(100),
                recipient:
                  "73446MSSCIPQAAZE3WAZWLA5O2IQIE4SJLFPM543GDQ7UGDU26XZFA6O64",
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
                amount: BigNumber("1000"),
                recipient:
                  "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4",
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
                  "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4",
              }),
              expectedStatus: {
                errors: { amount: new NotEnoughBalance() },
                warnings: {},
              },
            },
            {
              name: "send more than base reserve",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance.minus("100"),
                recipient:
                  "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4",
              }),
              expectedStatus: {
                errors: { amount: new NotEnoughBalance() },
                warnings: {},
              },
            },
            {
              name: "optIn",
              transaction: (t) => ({
                ...t,
                mode: "optIn",
                assetId: "algorand/asa/31231",
                amount: BigNumber("1000"),
                recipient:
                  "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4",
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
                amount: BigNumber("0"),
              },
            },
            // We got no token on this account, it's best if the live can provide a frozen seed for Algorand later
            // {
            //   name: "send Token",
            //   transaction: (t) => ({
            //     ...t,
            //     subAccountId:
            //       "libcore:1:algorand:fef9cf3252121f000324dd819b2c1d76910413924acaf6779b30e1fa1874d7af:+312769",
            //     amount: BigNumber("1000"),
            //     recipient:
            //       "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4",
            //   }),
            //   expectedStatus: {
            //     errors: {},
            //     warnings: {},
            //     amount: BigNumber("1000"),
            //   },
            // },
            {
              name: "send Token - more than available",
              transaction: (t) => ({
                ...t,
                subAccountId:
                  "libcore:1:algorand:fef9cf3252121f000324dd819b2c1d76910413924acaf6779b30e1fa1874d7af:+algorand/asa/342836",
                amount: BigNumber("100000000000"),
                recipient:
                  "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4",
              }),
              expectedStatus: {
                errors: { amount: new NotEnoughBalance() },
                warnings: {},
              },
            },
          ],
        },
      ],
    },
  },
};

export default dataset;
