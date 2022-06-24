import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { disconnect } from "./api";
import { BigNumber } from "bignumber.js";
import { canUnbond, MAX_UNLOCKINGS } from "./logic";
import type { Account } from "../../types";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import {
  PolkadotUnauthorizedOperation,
  PolkadotNotValidator,
  PolkadotBondMinimumAmount,
  PolkadotValidatorsRequired,
  PolkadotAllFundsWarning,
  PolkadotDoMaxSendInstead,
} from "./errors";
import type { DatasetTest, CurrenciesData } from "../../types";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";
const ACCOUNT_SAME_STASHCONTROLLER =
  "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV";
const ACCOUNT_STASH = "13jAJfhpFkRZj1TSSdFopaiFeKnof2q7g4GNdcxcg8Lvx6QN";
const ACCOUNT_CONTROLLER = "15oodc5d8DWJodZhTD6qsxxSQRYWhdkWCrwqNHajDirXRrAD";
const ACCOUNT_EMPTY = "111111111111111111111111111111111HC1";
const ACCOUNT_WITH_NO_OPERATION =
  "12EsPA79dvhtjp1bYvCiEWPsQmmdKGss44GzE3CT9tTo9g4Q";

const polkadot: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [
    "polkadotResources.unlockings", // Due to completion date that change everyday (estimated time)
    "polkadotResources.nominations", // TODO: try to only ignore status
    "polkadotResources.unlockedBalance", // It moved when an unbond is finished
  ],
  scanAccounts: [
    {
      name: "polkadot seed 1",
      apdus: `
        => 90010000142c00008062010080000000000000000000000000
        <= e283d1b141c1048635420b7138132acbe0ff47b71fc9f6a9089f78ab29a6b8143136377a7973345778677954514e6743744e6f597852463463784867385766516a4248414c7666615a585070776331549000
        => 90010000142c00008062010080000000800000008000000080
        <= 43ff8cc36e9804eb1f5d45cd834ebbae1d490c22b8f8a61af20b48e566dc53dc31325941383674525168486777553353536a3536616573554b4237474b76646e5a54545458526f7034766433596744569000
        => 90010000142c00008062010080010000800000008000000080
        <= 78a0189312a3f2817d89c71cec7e63bfbfbfa7145c384b3870ff1167a74c76d831336a414a666870466b525a6a3154535364466f70616946654b6e6f663271376734474e6463786367384c767836514e9000
        => 90010000142c00008062010080020000800000008000000080
        <= d4a3325e08977a29f19270b96a192eb73ce768e4bdf79565ba9cdbe3f0be6e9531356f6f646335643844574a6f645a6854443671737878535152595768646b57437277714e48616a44697258527241449000
        => 90010000142c00008062010080030000800000008000000080
        <= ffcc00cd09cbe8fd741a91269bd5f50445f4b0c3ad9f8b134341ba5e65bc24e131366e507037435537596d5a6a445248524437644d35434579505a6256615a3637435575356b4d77353957527a6f346a9000
        `,
    },
  ],
  accounts: [
    {
      // Account which is stash and controller
      raw: {
        id: `js:2:polkadot:${ACCOUNT_SAME_STASHCONTROLLER}:polkadotbip44`,
        seedIdentifier: ACCOUNT_SAME_STASHCONTROLLER,
        name: "Polkadot 1",
        derivationMode: "polkadotbip44",
        index: 0,
        freshAddress: ACCOUNT_SAME_STASHCONTROLLER,
        freshAddressPath: "44'/354'/0'/0'/0'",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "polkadot",
        unitMagnitude: 10,
        lastSyncDate: "",
        balance: "21000310",
      },
      transactions: [
        {
          name: "recipient and sender must not be the same",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_SAME_STASHCONTROLLER,
            amount: "100000000",
            mode: "send",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
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
            family: "polkadot",
            recipient: "ewrererewrew",
            amount: "100000000",
            mode: "send",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount Required",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_CONTROLLER,
            amount: "0",
            mode: "send",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
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
            family: "polkadot",
            recipient: ACCOUNT_CONTROLLER,
            amount: "1000000000000000",
            mode: "send",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Not created account and deposit not existing",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_WITH_NO_OPERATION,
            amount: "1000000",
            mode: "send",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalanceBecauseDestinationNotCreated(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and suffisent deposit",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_WITH_NO_OPERATION,
            amount: "10000000000",
            mode: "send",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            amount: new BigNumber("10000000000"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "[send] use all amount - should warn all funds",
          transaction: (t) => ({
            ...t,
            useAllAmount: true,
            mode: "send",
            recipient: ACCOUNT_EMPTY,
          }),
          expectedStatus: (account) => ({
            errors: {},
            warnings: {
              amount: new PolkadotAllFundsWarning(),
            },
            totalSpent: account.spendableBalance,
          }),
        },
        {
          name: "nominate without true validator",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_SAME_STASHCONTROLLER,
            amount: "0",
            mode: "nominate",
            era: null,
            validators: [ACCOUNT_SAME_STASHCONTROLLER],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              staking: new PolkadotNotValidator(),
            },
            warnings: {},
          },
        },
        {
          name: "nominate is empty",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_SAME_STASHCONTROLLER,
            amount: "0",
            mode: "nominate",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              staking: new PolkadotValidatorsRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "bond extra - not enough spendable",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_SAME_STASHCONTROLLER,
            amount: "2000000000000000000",
            mode: "bond",
            era: null,
            validators: null,
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "[Bond] New controller and suffisent deposit",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_EMPTY,
            amount: "10000000000",
            mode: "bond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            amount: new BigNumber("10000000000"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "[unbond] no amount",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: "",
            amount: "0",
            mode: "unbond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "[unbond] not enough locked balance",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: "",
            amount: "2000000000000000",
            mode: "unbond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "[rebond] no amount",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: "",
            amount: "0",
            mode: "rebond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "[unbond] use all amount",
          transaction: (t) => ({
            ...t,
            useAllAmount: true,
            mode: "unbond",
          }),
          expectedStatus: (a) => ({
            errors: {},
            warnings: {},
            amount: a.polkadotResources?.lockedBalance.minus(
              a.polkadotResources.unlockingBalance
            ),
          }),
        },
        {
          name: "[rebond] use all amount",
          transaction: (t) => ({
            ...t,
            useAllAmount: true,
            mode: "rebond",
          }),
          expectedStatus: (a) => ({
            errors: {},
            warnings: {},
            amount: a.polkadotResources?.unlockingBalance,
          }),
        },
      ],
    },
    {
      raw: {
        id: `js:2:polkadot:${ACCOUNT_STASH}:polkadotbip44`,
        seedIdentifier: ACCOUNT_STASH,
        name: "Polkadot 2",
        derivationMode: "polkadotbip44",
        index: 0,
        freshAddress: ACCOUNT_STASH,
        freshAddressPath: "44'/354'/2'/0'/0'",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "polkadot",
        unitMagnitude: 10,
        lastSyncDate: "",
        balance: "11000000000",
      },
      transactions: [
        {
          name: "stash can't nominate",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_SAME_STASHCONTROLLER,
            amount: "0",
            mode: "nominate",
            era: null,
            validators: [ACCOUNT_SAME_STASHCONTROLLER],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              staking: new PolkadotUnauthorizedOperation(),
            },
            warnings: {},
          },
        },
        {
          name: "[chill] unauthorized",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: "",
            amount: "1000",
            mode: "chill",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              staking: new PolkadotUnauthorizedOperation(),
            },
            warnings: {},
          },
        },
        {
          name: "[rebond] unauthorized",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: "",
            amount: "1000",
            mode: "rebond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              staking: new PolkadotUnauthorizedOperation(),
            },
            warnings: {},
          },
        },
        {
          name: "[withdrawUnbonded] unauthorized",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: "",
            amount: "1000",
            mode: "withdrawUnbonded",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              staking: new PolkadotUnauthorizedOperation(),
            },
            warnings: {},
          },
        },
      ],
    },
    // TODO: Write a setController test
    {
      raw: {
        id: `js:2:polkadot:${ACCOUNT_CONTROLLER}:polkadotbip44`,
        seedIdentifier: ACCOUNT_CONTROLLER,
        name: "Polkadot 3",
        derivationMode: "polkadotbip44",
        index: 0,
        freshAddress: ACCOUNT_CONTROLLER,
        freshAddressPath: "44'/354'/3'/0'/0'",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "polkadot",
        unitMagnitude: 10,
        lastSyncDate: "",
        balance: "11000000000",
      },
      transactions: [
        {
          name: "[send] Not enough balance",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_SAME_STASHCONTROLLER,
            amount: "12000000000",
            mode: "send",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "[send] Do Max Send Instead error",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_SAME_STASHCONTROLLER,
            amount: "5000000000",
            mode: "send",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new PolkadotDoMaxSendInstead(),
            },
            warnings: {},
          },
        },
        {
          name: "[send] use all amount no warn",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_SAME_STASHCONTROLLER,
            amount: "0",
            useAllAmount: true,
            mode: "send",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "[bond] no recipient",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: "",
            amount: "0",
            mode: "bond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              recipient: new RecipientRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "[bond] recipient with invalid address",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: "not a valid address",
            amount: "0",
            mode: "bond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "[bond] is already controller",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_CONTROLLER,
            amount: "100000000",
            mode: "bond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              recipient: new PolkadotUnauthorizedOperation(
                "Recipient is already a controller"
              ),
            },
            warnings: {},
          },
        },
        {
          name: "[bond] not minimum amount",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_CONTROLLER,
            amount: "1000000",
            mode: "bond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new PolkadotBondMinimumAmount(),
            },
            warnings: {},
          },
        },
        {
          name: "[bond] success",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: ACCOUNT_CONTROLLER,
            amount: "10000000000",
            mode: "bond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "[unbond] haveEnoughLockedBalance",
          transaction: fromTransactionRaw({
            family: "polkadot",
            recipient: "",
            amount: "100000",
            mode: "unbond",
            era: null,
            validators: [],
            fees: null,
            rewardDestination: null,
            numSlashingSpans: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
              staking: new PolkadotUnauthorizedOperation(),
            },
            warnings: {},
          },
        },
      ],
    },
  ],
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    polkadot,
  },
};

// Disconnect all api clients that could be open.
afterAll(async () => {
  await disconnect();
});

testBridge(dataset);

describe("canUnbond", () => {
  test("can unbond", () => {
    const account: Partial<Account> = {
      polkadotResources: {
        controller: "",
        stash: "",
        nonce: 0,
        numSlashingSpans: 0,
        lockedBalance: new BigNumber(10000),
        unlockedBalance: new BigNumber(0),
        unlockingBalance: new BigNumber(0),
        nominations: [],
        unlockings: [
          ...Array(MAX_UNLOCKINGS - 1).map(() => ({
            amount: new BigNumber(Math.random()),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as Account)).toBeTruthy();
  });
  test("can't unbond because unlockings is too much", () => {
    const account: Partial<Account> = {
      polkadotResources: {
        controller: "",
        stash: "",
        nonce: 0,
        numSlashingSpans: 0,
        lockedBalance: new BigNumber(1000000),
        unlockedBalance: new BigNumber(0),
        unlockingBalance: new BigNumber(0),
        nominations: [],
        unlockings: [
          ...Array(MAX_UNLOCKINGS).map(() => ({
            amount: new BigNumber(Math.random()),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as Account)).toBeFalsy();
  });
  test("can't unbond because not enough lockedBalance", () => {
    const account: Partial<Account> = {
      polkadotResources: {
        controller: "",
        stash: "",
        nonce: 0,
        numSlashingSpans: 0,
        lockedBalance: new BigNumber(100),
        unlockedBalance: new BigNumber(0),
        unlockingBalance: new BigNumber(100),
        nominations: [],
        unlockings: [
          ...Array(MAX_UNLOCKINGS).map(() => ({
            amount: new BigNumber(Math.random()),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as Account)).toBeFalsy();
  });
});
