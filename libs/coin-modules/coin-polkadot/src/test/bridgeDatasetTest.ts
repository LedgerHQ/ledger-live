import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { fromTransactionRaw } from "../bridge/transaction";
import {
  PolkadotUnauthorizedOperation,
  PolkadotNotValidator,
  PolkadotBondMinimumAmount,
  PolkadotValidatorsRequired,
  PolkadotAllFundsWarning,
} from "../types";

import type { PolkadotAccount, Transaction } from "../types";
const ACCOUNT_SAME_STASHCONTROLLER = "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV";
const ACCOUNT_STASH = "13jAJfhpFkRZj1TSSdFopaiFeKnof2q7g4GNdcxcg8Lvx6QN";
const ACCOUNT_CONTROLLER = "15oodc5d8DWJodZhTD6qsxxSQRYWhdkWCrwqNHajDirXRrAD";
const ACCOUNT_EMPTY = "111111111111111111111111111111111HC1";
const ACCOUNT_WITH_NO_OPERATION = "12EsPA79dvhtjp1bYvCiEWPsQmmdKGss44GzE3CT9tTo9g4Q";

const assethub_polkadot: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [
    "polkadotResources.unlockings", // Due to completion date that change everyday (estimated time)
    "polkadotResources.nominations", // TODO: try to only ignore status
    "polkadotResources.unlockedBalance", // It moved when an unbond is finished
  ],
  scanAccounts: [
    {
      name: "polkadot seed 1",
      apdus: `
        => f9010000182c0000806201008000000080000000000000000000000000
        <= 3a521fa830998568da9c205c987dcd157a78b2bd30ece3d1b6c32213986864ca31324b5542335272346163346469354a47707a545935474e516b44564e6b50556b636a324d4746546d7a617a4d5364739000
        => f9010000182c0000806201008000000080000000800000008000000000
        <= 7e52138bf614dddff1116623b027ea92d6015d8fe741575b78ac7773545066bd31337264523573727657463533566b4e654a757a35576b476b4736465358515141375a423551424769673441544373399000
        `,
    },
  ],
  accounts: [
    {
      // Account which is stash and controller
      raw: {
        id: `js:2:assethub_polkadot:${ACCOUNT_SAME_STASHCONTROLLER}:polkadotbip44`,
        seedIdentifier: ACCOUNT_SAME_STASHCONTROLLER,
        name: "Polkadot 1",
        derivationMode: "polkadotbip44",
        index: 0,
        freshAddress: ACCOUNT_SAME_STASHCONTROLLER,
        freshAddressPath: "44'/354'/0'/0'/0'",
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "assethub_polkadot",
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
        id: `js:2:assethub_polkadot:${ACCOUNT_STASH}:polkadotbip44`,
        seedIdentifier: ACCOUNT_STASH,
        name: "Polkadot 2",
        derivationMode: "polkadotbip44",
        index: 0,
        freshAddress: ACCOUNT_STASH,
        freshAddressPath: "44'/354'/2'/0'/0'",
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "assethub_polkadot",
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
          expectedStatus: (_account, _transaction, _status) => ({
            errors: {},
            warnings: {
              amount: new PolkadotAllFundsWarning(),
            },
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
        id: `js:2:assethub_polkadot:${ACCOUNT_CONTROLLER}:polkadotbip44`,
        seedIdentifier: ACCOUNT_CONTROLLER,
        name: "Polkadot 3",
        derivationMode: "polkadotbip44",
        index: 0,
        freshAddress: ACCOUNT_CONTROLLER,
        freshAddressPath: "44'/354'/3'/0'/0'",
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "assethub_polkadot",
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
    assethub_polkadot,
  },
};
