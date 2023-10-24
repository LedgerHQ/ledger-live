import { BigNumber } from "bignumber.js";
import { canUnbond, MAX_UNLOCKINGS } from "../logic";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import {
  PolkadotUnauthorizedOperation,
  PolkadotNotValidator,
  PolkadotBondMinimumAmount,
  PolkadotValidatorsRequired,
  PolkadotAllFundsWarning,
  PolkadotDoMaxSendInstead,
} from "../types";
import { fromTransactionRaw } from "../transaction";
import type { PolkadotAccount, Transaction } from "../types";
const ACCOUNT_SAME_STASHCONTROLLER = "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV";
const ACCOUNT_STASH = "13jAJfhpFkRZj1TSSdFopaiFeKnof2q7g4GNdcxcg8Lvx6QN";
const ACCOUNT_CONTROLLER = "15oodc5d8DWJodZhTD6qsxxSQRYWhdkWCrwqNHajDirXRrAD";
const ACCOUNT_EMPTY = "111111111111111111111111111111111HC1";
const ACCOUNT_WITH_NO_OPERATION = "12EsPA79dvhtjp1bYvCiEWPsQmmdKGss44GzE3CT9tTo9g4Q";

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
        => 90010000142c00008062010080000000800000000000000000
        <= c71b1e00ca34fdd14ea065917a67168675828927e3adc3b68f444bf85b4d24be3135573461755239707652335a5765616f50516f4562616d54535557347571335072515369564a4e4e7953385868314e9000
        => 90010000142c00008062010080000000800000008000000080
        <= 845175a888f0ced372bd352d59cb51242dff8438c3dd12a703835c25bdfa3f9231337a565838337a74575939446d69757446525738374262676b627631517031666366706f4a6964626448776b3335649000
        => 90010000142c00008062010080010000800000008000000080
        <= 3a521fa830998568da9c205c987dcd157a78b2bd30ece3d1b6c32213986864ca31324b5542335272346163346469354a47707a545935474e516b44564e6b50556b636a324d4746546d7a617a4d5364739000
        => 90010000142c00008062010080020000800000008000000080
        <= 7e52138bf614dddff1116623b027ea92d6015d8fe741575b78ac7773545066bd31337264523573727657463533566b4e654a757a35576b476b4736465358515141375a423551424769673441544373399000
        => 90010000142c00008062010080030000800000008000000080
        <= dfd77108b64b8173805852f7550f1f2d6c166968d31d5c4984187c9cb1969d9331363456674b366f6f5a3466557555346946567770537558774658474c55356e5454577a4736347672447167697077689000
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
            validators: undefined,
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
          transaction: t => ({
            ...t,
            useAllAmount: true,
            mode: "unbond",
          }),
          expectedStatus: a => ({
            errors: {},
            warnings: {},
            amount: (a as PolkadotAccount).polkadotResources?.lockedBalance.minus(
              (a as PolkadotAccount).polkadotResources.unlockingBalance,
            ),
          }),
        },
        {
          name: "[rebond] use all amount",
          transaction: t => ({
            ...t,
            useAllAmount: true,
            mode: "rebond",
          }),
          expectedStatus: a => ({
            errors: {},
            warnings: {},
            amount: (a as PolkadotAccount).polkadotResources?.unlockingBalance,
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
          name: "[send] use all amount - should warn all funds",
          transaction: t => ({
            ...t,
            useAllAmount: true,
            mode: "send",
            recipient: ACCOUNT_SAME_STASHCONTROLLER,
          }),
          expectedStatus: account => ({
            errors: {},
            warnings: {
              amount: new PolkadotAllFundsWarning(),
            },
            totalSpent: account.spendableBalance,
          }),
        },
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
              recipient: new PolkadotUnauthorizedOperation("Recipient is already a controller"),
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

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    polkadot,
  },
};

describe("canUnbond", () => {
  test("can unbond", () => {
    const account: Partial<PolkadotAccount> = {
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
            amount: new BigNumber(100000),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as PolkadotAccount)).toBeTruthy();
  });
  test("can't unbond because unlockings is too much", () => {
    const account: Partial<PolkadotAccount> = {
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
            amount: new BigNumber(100000),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as PolkadotAccount)).toBeFalsy();
  });
  test("can't unbond because not enough lockedBalance", () => {
    const account: Partial<PolkadotAccount> = {
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
            amount: new BigNumber(100000),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as PolkadotAccount)).toBeFalsy();
  });
});
