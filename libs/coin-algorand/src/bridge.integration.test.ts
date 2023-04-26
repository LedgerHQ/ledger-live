import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { AlgorandASANotOptInInRecipient } from "./errors";
import type { AlgorandTransaction, Transaction } from "./types";

const algorand: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [
    "algorandResources.rewards", // We cant keep track of this since it's always moving
    "balance", // Rewards are included, same as above
    "spendableBalance", // Same since the rewards are included here too
  ],
  scanAccounts: [
    {
      name: "algorand seed 1",
      apdus: `
      => 800300000480000000
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
        id: "js:2:algorand:c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c4:",
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
              "js:2:algorand:ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q:+312769",
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
              "js:2:algorand:ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q:+312769",
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
              "js:2:algorand:ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q:+312769",
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
        {
          name: "send max",
          transaction: (t) => ({
            ...t,
            recipient:
              "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI",
            useAllAmount: true,
          }),
          expectedStatus: (account, _, status) => {
            return {
              amount: account.spendableBalance.minus(status.estimatedFees),
              warnings: {},
              errors: {},
            };
          },
        },
      ],
    },
    {
      raw: {
        id: "js:2:algorand:MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI:",
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
          name: "Can't send ASA if Algo balance too low",
          transaction: (t) => ({
            ...t,
            subAccountId:
              "js:2:algorand:MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI:+312769",
            amount: new BigNumber("1000000"),
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
};

export const dataset: DatasetTest<AlgorandTransaction> = {
  implementations: ["js"],
  currencies: {
    algorand,
  },
};

describe("Algorand bridge", () => {
  test.todo(
    "This is an empty test to make jest command pass. Remove it once there is a real test."
  );
});

/**
 * NOTE: if tests are added to this file,
 * like done in libs/coin-polkadot/src/bridge.integration.test.ts for example,
 * this file fill need to be imported in ledger-live-common
 * libs/ledger-live-common/src/families/algorand/bridge.integration.test.ts
 * like done for polkadot.
 * cf.
 * - libs/coin-polkadot/src/bridge.integration.test.ts
 * - libs/ledger-live-common/src/families/polkadot/bridge.integration.test.ts
 */
