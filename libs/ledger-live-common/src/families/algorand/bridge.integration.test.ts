import { BigNumber } from "bignumber.js";
import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { DatasetTest } from "../../types";
import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import { AlgorandASANotOptInInRecipient } from "../../errors";
import type { AlgorandTransaction } from "./types";
// const notCreatedAlgorandAddress =
//   "ZBILW5BPM7AQU54YQZICSGS4J7KJ2XV6OC3DFUQ7BB4DVLYKKUEVWDDBGM";

const dataset: DatasetTest<AlgorandTransaction> = {
  implementations: ["js"],
  currencies: {
    algorand: {
      FIXME_ignoreAccountFields: [
        "algorandResources.rewards", // We cant keep track of this since it's always moving
        "balance", // Rewards are included, same as above
        "spendableBalance", // Same since the rewards are included here too
      ],
      scanAccounts: [
        {
          name: "algorand seed 1",
          apdus: `
          => 800300000400000000
          <= c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c49000
          => 800300000480000000
          <= c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c49000
          => 800300000480000001
          <= 21b3068ca2b9a3b0b1fc68d9ecbd61663f6957c68a9c767aa14a8abb437180e69000
          => 800300000480000002
          <= cc2b54ea5cbda5de6957086a8435c43a06e26559b2bfaebec56b748ec5a2a0519000
          => 800300000480000003
          <= 6104eb314f51f4db5733976bd8c066297019ebaa6adcf39b4aa318d553c571cc9000
          => 800300000480000004
          <= 6549e16ee1e242aba9d116dab058b6e33e4c6d801d3cbfe860195fc6e42940319000
          `,
        },
      ],
      accounts: [
        {
          FIXME_tests: ["balance is sum of ops"],
          // Rewards issues
          raw: {
            id: "js:1:algorand:c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c4:",
            seedIdentifier:
              "c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c4",
            name: "Algorand 1",
            xpub: "c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c4",
            derivationMode: "",
            index: 0,
            freshAddress:
              "ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q",
            freshAddressPath: "44'/283'/0'/0/0",
            freshAddresses: [
              {
                address:
                  "ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q",
                derivationPath: "44'/283'/0'/0/0",
              },
            ],
            unitMagnitude: 6,
            blockHeight: 8518049,
            operations: [],
            pendingOperations: [],
            currencyId: "algorand",
            lastSyncDate: "",
            balance: "1167089",
            spendableBalance: "567089",
            subAccounts: [],
          },
          transactions: [
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
              name: "optIn",
              transaction: (t) => ({
                ...t,
                mode: "optIn",
                assetId: "algorand/asa/31231",
                amount: new BigNumber("1000"),
                recipient:
                  "ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q",
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
                amount: new BigNumber("0"),
              },
            },
            {
              name: "Can't send ASA to an address that didn't Opt-in",
              transaction: (t) => ({
                ...t,
                subAccountId:
                  "js:1:algorand:c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c4:+312769",
                amount: new BigNumber("1000"),
                recipient:
                  "ZQVVJ2S4XWS542KXBBVIINOEHIDOEZKZWK725PWFNN2I5RNCUBI53RT2EY",
              }),
              expectedStatus: {
                errors: {
                  recipient: new AlgorandASANotOptInInRecipient(),
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
        {
          raw: {
            id: "js:1:algorand:6104eb314f51f4db5733976bd8c066297019ebaa6adcf39b4aa318d553c571cc:",
            seedIdentifier:
              "c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c4",
            xpub: "6104eb314f51f4db5733976bd8c066297019ebaa6adcf39b4aa318d553c571cc",
            name: "Algorand 4",
            derivationMode: "",
            index: 3,
            freshAddress:
              "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI",
            freshAddressPath: "44'/283'/3'/0/0",
            freshAddresses: [
              {
                address:
                  "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI",
                derivationPath: "44'/283'/3'/0/0",
              },
            ],
            unitMagnitude: 6,
            blockHeight: 8518189,
            balance: "0",
            spendableBalance: "0",
            currencyId: "algorand",
            lastSyncDate: "",
            operations: [],
            pendingOperations: [],
          },
          transactions: [
            {
              name: "Can't send funds if balance too low",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("1000"),
                recipient:
                  "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4",
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
              },
            },
            {
              name: "Can't optIn if Algo balance too low",
              transaction: (t) => ({
                ...t,
                mode: "optIn",
                assetId: "algorand/asa/31231",
                amount: new BigNumber("1000"),
                recipient:
                  "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4",
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
            {
              name: "Can't send ASA if Algo balance too low",
              transaction: (t) => ({
                ...t,
                subAccountId:
                  "js:1:algorand:fef9cf3252121f000324dd819b2c1d76910413924acaf6779b30e1fa1874d7af:+312769",
                amount: new BigNumber("1000"),
                recipient:
                  "YWZPDCL5XQPCPGBXKB7KAG7YF2QGCGEX37YTSM55CPEPHKNE2ZSKRAXNQ4",
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
