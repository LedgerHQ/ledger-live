import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import {
  TronInvalidFreezeAmount,
  TronInvalidUnDelegateResourceAmount,
  TronInvalidVoteCount,
  TronNoFrozenForBandwidth,
  TronNoFrozenForEnergy,
  TronNoReward,
  TronNoUnfrozenResource,
  TronNotEnoughTronPower,
  TronSendTrc20ToNewAccountForbidden,
  TronUnexpectedFees,
  TronVoteRequired,
} from "./errors";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import "../../__tests__/test-helpers/setup";
import { activationFees } from "./constants";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";

const unactivatedAddress = "TXFeV31qgUQYMLog3axKJeEBbXpQFtHsXD";
const activatedAddress1 = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";

const expectedTokenAccount = a => {
  invariant(a && a.type === "TokenAccount", "expected token account");
  return a;
};

const getTokenAccountId = (account, id) =>
  expectedTokenAccount(
    (account.subAccounts || []).find(a => expectedTokenAccount(a).token.id === id),
  ).id;

const tron: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [
    "tronResources.cacheTransactionInfoById", // this is a cache, don't save it
    "tronResources.unwithdrawnReward", // it changes every vote cycles
    "tronResources.bandwidth", // it changes if a tx is made
    "tronResources.energy", // it keep changing?
  ],
  scanAccounts: [
    {
      name: "tron seed 1",
      apdus: `
          => e00200000d038000002c800000c380000000
          <= 41049fc19cbc6d0f525b1c6947b4a36aec74b48e15f2531c5e7e58d272c9e926786da290eb3505d8fab9c83818c1174d9bc96fd18e0527365cba6b9534d43ad5052b2254546962427833526b4a4d6355394171357348337a376a5733455057676b324252419000
          => e002000015058000002c800000c3800000000000000000000000
          <= 41040897dbec3465fcfa24324d6be690bccab3bdb5bba7f7cbe756d58362336a91a4a8b9bdd0cb25cb97afdde08c85c2081f3a3a4ba96a012c91c835e992783ceca1225452716b526e416a3663654a4659416e3270316545376157726742427774646853399000
          => e002000015058000002c800000c3800000010000000000000000
          <= 4104af6028b35cd69b028df9bd1a8eccc9f7cc46ca916babe1b87500e17a65b8833e0d4a90e6ba7cfd76492378f43868cc48c89451362033cf5982f2fba92306fc95225448416534424e56787032393371677951457158456b484d705063717447373362699000
          => e002000015058000002c800000c3800000020000000000000000
          <= 410461936750537e962cb02353c8906cebfd61f35ee0b704be0a02640e5f2e0bb152c0614008db5753fc728cb4fd1eac47f843229ccb928890f3ac805d8cdb6b8e332254576570556e79427a487832616f45674e476f745a484379625a4a5a6531414864579000
          => e002000015058000002c800000c3800000030000000000000000
          <= 4104fd0fa05cefc7c50894935125c1777bba938043e19ad96fd62d4ee708e5bc5b610f401becc0b4ecb48370e1bbaf4afda6e11b425b424c8ff007205034164399392254544250424b316e386e5831566b5950683766734d35364b4c36473948524d3756639000
          => e002000015058000002c800000c3800000040000000000000000
          <= 41041da2283f752d855d858ea3b86ef44ed78def4878000e2508ed1a4ca5fce6a120a1f3edfbc14173577057b62e156f4a110410d886bb022e398cf607d8eb26f0c12254527a4164386b37386f623577545748657065447051727555754b596666683438789000
          => e002000015058000002c800000c3800000050000000000000000
          <= 4104dfeedfe3ec947d26b9b2be199c4d2a1b59b53ce8938fa37a3ebfccba5cd3432457987972d62f5ff7cebffba1655efe26324e25ae1c33d4c6b39d1ccf1a6c433f2254434b4655664672384555394356664b7a7138764c50786b5a5647347641657754649000
          => e002000015058000002c800000c3800000060000000000000000
          <= 4104f0bc4270d8d593486409062058abeabb87a0f2907b57d0f92a9173164e39b1a12a61ffce4c002f395cab8a790ccd00d41e056a32d285a01b218334d294abbf1f2254526552347a64464537384e614b67555555654869564758534763434434634e796a9000
          => e002000015058000002c800000c3800000070000000000000000
          <= 4104ac3f861b2006b1d950677b0ac77cc660a497d9e3afcb6caeb2bf4a67943535d56c0915fbd7476e93d50317fd13084ff3eb820a60cc448627e2e1be51c6145dc8225458466556333171675551594d4c6f673361784b4a654542625870514674487358449000
      `,
    },
  ],
  accounts: [
    {
      transactions: [
        {
          name: "sendSuccess",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: activatedAddress1,
            amount: "1000000",
            networkInfo: null,
            mode: "send",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {},
            warnings: {},
            totalSpent: new BigNumber("1000000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "Send max",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: activatedAddress1,
            amount: "0",
            useAllAmount: true,
            networkInfo: null,
            mode: "send",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: account => ({
            amount: account.spendableBalance,
            errors: {},
            warnings: {},
            totalSpent: account.spendableBalance,
            estimatedFees: new BigNumber("0"),
          }),
        },
        {
          name: "useAllAmountToUnactivatedAddressSuccess",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: unactivatedAddress,
            amount: "0",
            useAllAmount: true,
            networkInfo: null,
            mode: "send",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: (account, transaction, status) => {
            return {
              amount: account.spendableBalance.minus(status.estimatedFees),
              errors: {},
              warnings: {},
              totalSpent: account.spendableBalance,
            };
          },
        },
        {
          name: "voteSuccess",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: activatedAddress1,
            amount: "0",
            networkInfo: null,
            mode: "vote",
            duration: undefined,
            resource: undefined,
            votes: [
              {
                address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
                voteCount: 1,
              },
              {
                address: "TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U",
                voteCount: 1,
              },
            ],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {},
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "freezeBandwidthSuccess",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "1000000",
            networkInfo: null,
            mode: "freeze",
            duration: undefined,
            resource: "BANDWIDTH",
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {},
            warnings: {},
            totalSpent: new BigNumber("1000000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "freezeEnergySuccess",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "1000000",
            networkInfo: null,
            mode: "freeze",
            duration: undefined,
            resource: "ENERGY",
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {},
            warnings: {},
            totalSpent: new BigNumber("1000000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "NotEnoughFrozenEnergy",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "TBsyKdNsCKNXLgvneeUJ3rbXgWSgk6paTM",
            amount: "1000000",
            networkInfo: null,
            mode: "unfreeze",
            duration: undefined,
            resource: "ENERGY",
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              resource: new TronNoFrozenForEnergy(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "NotEnoughFrozenBandwidth",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "TBsyKdNsCKNXLgvneeUJ3rbXgWSgk6paTM",
            amount: "1000000",
            networkInfo: null,
            mode: "unfreeze",
            duration: undefined,
            resource: "BANDWIDTH",
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              resource: new TronNoFrozenForBandwidth(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "NoUnfrozenBalances",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "0",
            networkInfo: null,
            mode: "withdrawExpireUnfreeze",
            duration: undefined,
            votes: [],
            resource: undefined,
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              resource: new TronNoUnfrozenResource(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "InvalidUnDelegateResourceAmount",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "TBsyKdNsCKNXLgvneeUJ3rbXgWSgk6paTM",
            amount: "100",
            networkInfo: null,
            mode: "unDelegateResource",
            duration: undefined,
            resource: "BANDWIDTH",
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              resource: new TronInvalidUnDelegateResourceAmount(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "recipientRequired",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "1000000",
            networkInfo: null,
            mode: "send",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {
              recipient: new RecipientRequired(),
            },
            warnings: {},
            totalSpent: new BigNumber("1000000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "invalidRecipientIsTheSame",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi",
            amount: "1000000",
            networkInfo: null,
            mode: "send",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
            totalSpent: new BigNumber("1000000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "invalidRecipientUnknown",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "unknown",
            amount: "1000000",
            networkInfo: null,
            mode: "send",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
            totalSpent: new BigNumber("1000000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "amountRequired",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: activatedAddress1,
            amount: "0",
            networkInfo: null,
            mode: "send",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "notEnoughBalance",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: activatedAddress1,
            amount: "1000000000",
            networkInfo: null,
            mode: "send",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("1000000000"),
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
            totalSpent: new BigNumber("1000000000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "notEnoughBalance to unactivated",
          transaction: t => ({
            ...t,
            amount: new BigNumber(100),
            recipient: unactivatedAddress,
          }),
          expectedStatus: () => ({
            estimatedFees: activationFees,
          }),
        },
        {
          name: "enoughBalance near the max",
          transaction: (t, account) => ({
            ...t,
            recipient: unactivatedAddress,
            amount: account.spendableBalance.minus(activationFees).minus(1),
          }),
          expectedStatus: () => ({
            errors: {},
          }),
        },
        {
          name: "enoughBalance at exactly the max",
          transaction: (t, account) => ({
            ...t,
            recipient: unactivatedAddress,
            amount: account.spendableBalance.minus(activationFees),
          }),
          expectedStatus: () => ({
            errors: {},
          }),
        },
        {
          name: "estimatedFeesWarning",
          // send 1TRX to new account = +0.1TRX of fees
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: unactivatedAddress,
            amount: "1000000",
            networkInfo: null,
            mode: "send",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {},
            warnings: {
              fee: new TronUnexpectedFees("Estimated fees"),
            },
            totalSpent: new BigNumber("2000000"),
            estimatedFees: new BigNumber("1000000"),
          },
        },
        {
          name: "tronSendTrc20ToContractAddressSuccess",
          transaction: (t, account) => ({
            ...t,
            recipient: "TYmGYpY3LuHHge9jmTtq2aQmSpUpqKcZtJ",
            // corresponds to a valid deposit contract address
            subAccountId: getTokenAccountId(
              account,
              "tron/trc20/TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
            ),
            amount: new BigNumber("1000000"),
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {},
            warnings: {},
            totalSpent: new BigNumber("1000000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "tronSendTrc20ToNewAccountForbidden",
          transaction: (t, account) => ({
            ...t,
            recipient: unactivatedAddress,
            subAccountId: getTokenAccountId(
              account,
              "tron/trc20/TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
            ),
            amount: new BigNumber("1000000"),
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {
              recipient: new TronSendTrc20ToNewAccountForbidden(),
            },
            warnings: {},
            totalSpent: new BigNumber("1000000"),
            estimatedFees: new BigNumber("0"),
          },
        }, // FIXME account have moved...

        /*
      {
        name: "tronSendTrc20NotEnoughEnergyWarning",
        transaction: fromTransactionRaw({
          family: "tron",
          recipient: activatedAddress1,
          subAccountId:
            "tronjs:2:tron:THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi:+TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
          amount: "1000000",
          networkInfo: null,
          mode: "send",
          duration: undefined,
          resource: undefined,
          votes: []
        }),
        expectedStatus: {
          amount: new BigNumber("1000000"),
          errors: {},
          warnings: { amount: new TronNotEnoughEnergy() },
          totalSpent: new BigNumber("1000000"),
          estimatedFees: new BigNumber("0")
        }
      },
      */
        {
          name: "tronSendTrc20Success",
          transaction: (t, account) => ({
            ...t,
            recipient: activatedAddress1,
            subAccountId: getTokenAccountId(
              account,
              "tron/trc20/TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
            ),
            amount: new BigNumber("1000000"),
          }),
          expectedStatus: {
            amount: new BigNumber("1000000"),
            errors: {},
            warnings: {},
            totalSpent: new BigNumber("1000000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "tronInvalidFreezeAmount",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "100000",
            networkInfo: null,
            mode: "freeze",
            duration: undefined,
            resource: "BANDWIDTH",
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("100000"),
            errors: {
              amount: new TronInvalidFreezeAmount(),
            },
            warnings: {},
            totalSpent: new BigNumber("100000"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "tronLegacyUnFreezeBandwidth",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "1000000",
            networkInfo: null,
            mode: "legacyUnfreeze",
            duration: undefined,
            resource: "BANDWIDTH",
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {},
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        // Not so sure how ot make this test work again, frozen energy seems to be expired.
        // {
        //   name: "tronNoFrozenForEnergy",
        //   transaction: fromTransactionRaw({
        //     family: "tron",
        //     recipient: "",
        //     amount: "0",
        //     networkInfo: null,
        //     mode: "unfreeze",
        //     duration: undefined,
        //     resource: "ENERGY",
        //     votes: [],
        //   }),
        //   expectedStatus: {
        //     amount: new BigNumber("0"),
        //     errors: {
        //       resource: new TronNoFrozenForEnergy(),
        //     },
        //     warnings: {},
        //     totalSpent: new BigNumber("0"),
        //     estimatedFees: new BigNumber("0"),
        //   },
        // },
        {
          name: "tronVoteRequired",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "0",
            networkInfo: null,
            mode: "vote",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              vote: new TronVoteRequired(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "invalidVoteAddress",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: activatedAddress1,
            amount: "0",
            networkInfo: null,
            mode: "vote",
            duration: undefined,
            resource: undefined,
            votes: [
              {
                address: "abcde",
                voteCount: 1,
              },
            ],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              vote: new InvalidAddress(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "tronInvalidVoteCount",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: activatedAddress1,
            amount: "0",
            networkInfo: null,
            mode: "vote",
            duration: undefined,
            resource: undefined,
            votes: [
              {
                address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
                voteCount: 0,
              },
            ],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              vote: new TronInvalidVoteCount(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "tronNotEnoughTronPower",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "0",
            networkInfo: null,
            mode: "vote",
            duration: undefined,
            resource: undefined,
            votes: [
              {
                address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
                voteCount: 5,
              },
              {
                address: "TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U",
                voteCount: 5,
              },
            ],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              vote: new TronNotEnoughTronPower(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "tronNoReward",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "0",
            networkInfo: null,
            mode: "claimReward",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              reward: new TronNoReward(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
      ],
      raw: {
        id: "js:2:tron:THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi:",
        seedIdentifier: "THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi",
        name: "Tron 2",
        derivationMode: "",
        index: 1,
        freshAddress: "THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi",
        freshAddressPath: "44'/195'/0'/0/0",
        pendingOperations: [],
        currencyId: "tron",
        unitMagnitude: 18,
        balance: "10006000",
        spendableBalance: "1606000",
        subAccounts: [],
        operations: [],
        freshAddresses: [
          {
            address: "THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi",
            derivationPath: "44'/195'/0'/0/0",
          },
        ],
        lastSyncDate: "",
        blockHeight: 0,
      },
    },
    {
      transactions: [
        {
          name: "claimRewardSuccess",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "0",
            networkInfo: null,
            mode: "claimReward",
            duration: undefined,
            resource: undefined,
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {},
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
        {
          name: "tronNoFrozenForBandwidth",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "TBsyKdNsCKNXLgvneeUJ3rbXgWSgk6paTM",
            amount: "1000000",
            networkInfo: null,
            mode: "unfreeze",
            duration: undefined,
            resource: "BANDWIDTH",
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              resource: new TronNoFrozenForBandwidth(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
      ],
      FIXME_tests: [
        /**
        Error:
          - Expected
          + Received
          - "26003017"
          + "26000197"
         The live-common ignore all unsupported tokens (by the nano app) transactions.

        Difference of 2820 (0.00282 TRX) is due to an unsupported tr10 transaction which have fee:
        https://tronscan.org/#/transaction/6fe0b288e0cce30396afe40b365ee57642be44146acc847672fe3d328309d2b0
         To re-enable when the support will be done.
      */
        "balance is sum of ops",
      ],
      raw: {
        id: "js:2:tron:TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9:",
        seedIdentifier: activatedAddress1,
        name: "Tron 1",
        derivationMode: "",
        index: 0,
        freshAddress: activatedAddress1,
        freshAddressPath: "44'/195'/0'/0/0",
        pendingOperations: [],
        currencyId: "tron",
        unitMagnitude: 18,
        balance: "26000197",
        spendableBalance: "197",
        subAccounts: [],
        operations: [],
        freshAddresses: [
          {
            address: activatedAddress1,
            derivationPath: "44'/195'/0'/0/0",
          },
        ],
        lastSyncDate: "",
        blockHeight: 0,
      },
    },
    {
      transactions: [
        {
          name: "FreezeEnergySuccess",
          transaction: fromTransactionRaw({
            amount: "1000000",
            recipient: "",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "271",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "freeze",
            resource: "ENERGY",
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            amount: BigNumber("1000000"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("1000000"),
          },
        },
        {
          name: "NotEnoughBalanceToFreeze",
          transaction: fromTransactionRaw({
            amount: "100000000000000000",
            recipient: "",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "271",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "freeze",
            resource: "ENERGY",
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
            amount: BigNumber("100000000000000000"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("100000000000000000"),
          },
        },
        {
          name: "FreezeBandwidthSuccess",
          transaction: fromTransactionRaw({
            amount: "1000000",
            recipient: "",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "271",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "freeze",
            resource: "BANDWIDTH",
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            amount: BigNumber("1000000"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("1000000"),
          },
        },
        {
          name: "UnfreezeEnergySuccess",
          transaction: fromTransactionRaw({
            amount: "1000000",
            recipient: "",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "271",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "unfreeze",
            resource: "ENERGY",
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            amount: BigNumber("0"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("0"),
          },
        },
        {
          name: "NotEnoughEnergyUnfreeze",
          transaction: fromTransactionRaw({
            amount: "10000000000",
            recipient: "",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "271",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "unfreeze",
            resource: "ENERGY",
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {
              resource: new TronNoFrozenForEnergy(),
            },
            warnings: {},
            amount: BigNumber("0"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("0"),
          },
        },
        {
          name: "UnfreezeBandwidthSuccess",
          transaction: fromTransactionRaw({
            amount: "1000000",
            recipient: "",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "272",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "unfreeze",
            resource: "BANDWIDTH",
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            amount: BigNumber("0"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("0"),
          },
        },
        {
          name: "withdrawExpireUnfreezeSuccess",
          transaction: fromTransactionRaw({
            amount: "0",
            recipient: "",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "274",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "withdrawExpireUnfreeze",
            resource: null,
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            amount: BigNumber("0"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("0"),
          },
        },
        {
          name: "UndelegateResourceSuccess",
          transaction: fromTransactionRaw({
            amount: "1000000",
            recipient: "TKc4RbfcDf6MrHXENfRAG23ue8YYgaTh8U",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "268",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "unDelegateResource",
            resource: "ENERGY",
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            amount: BigNumber("0"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("0"),
          },
        },
        {
          name: "AddressIsAlsoSourceUndelegateResourceError",
          transaction: fromTransactionRaw({
            amount: "1000",
            recipient: "TUxd6v64YTWkfpFpNDdtgc5Ps4SfGxwizT",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "268",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "unDelegateResource",
            resource: "ENERGY",
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
            amount: BigNumber("0"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("0"),
          },
        },
        {
          name: "UndelegateResourceError",
          transaction: fromTransactionRaw({
            amount: "1000000000",
            recipient: "TKc4RbfcDf6MrHXENfRAG23ue8YYgaTh8U",
            useAllAmount: false,
            subAccountId: null,
            networkInfo: {
              family: "tron",
              freeNetUsed: "0",
              freeNetLimit: "600",
              netUsed: "268",
              netLimit: "584",
              energyUsed: "0",
              energyLimit: "214",
            },
            family: "tron",
            mode: "unDelegateResource",
            resource: "ENERGY",
            duration: 3,
            votes: [],
          }),
          expectedStatus: {
            errors: {
              resource: new TronInvalidUnDelegateResourceAmount(),
            },
            warnings: {},
            amount: BigNumber("0"),
            estimatedFees: BigNumber("0"),
            totalSpent: BigNumber("0"),
          },
        },
        {
          name: "unfreezeLegacyNoFrozenForBandwidth",
          transaction: fromTransactionRaw({
            family: "tron",
            recipient: "",
            amount: "1000000",
            networkInfo: null,
            mode: "legacyUnfreeze",
            duration: undefined,
            resource: "BANDWIDTH",
            votes: [],
          }),
          expectedStatus: {
            amount: new BigNumber("0"),
            errors: {
              resource: new TronNoFrozenForBandwidth(),
            },
            warnings: {},
            totalSpent: new BigNumber("0"),
            estimatedFees: new BigNumber("0"),
          },
        },
      ],
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:tron:TUxd6v64YTWkfpFpNDdtgc5Ps4SfGxwizT:",
        seedIdentifier:
          "0416c02ea5e939eed995f75c44667a66b9c8dfddede8c6d54211f64b1dace9e1c40bcbbd5341480f43a5f37c7ab3a0c53f9cccff57d59bb0368d1e744135d7f68a",
        name: "Tron 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "TUxd6v64YTWkfpFpNDdtgc5Ps4SfGxwizT",
        freshAddressPath: "44'/195'/0'/0/0",
        freshAddresses: [],
        blockHeight: 57509444,
        creationDate: "2023-10-31T14:27:27.000Z",
        operationsCount: 96,
        operations: [],
        pendingOperations: [],
        currencyId: "tron",
        unitMagnitude: 6,
        lastSyncDate: "2023-12-21T12:28:03.177Z",
        balance: "859005207",
        spendableBalance: "252128207",
        subAccounts: [],
        // @ts-expect-error expected
        tronResources: {
          frozen: { bandwidth: { amount: "539000000" }, energy: { amount: "14877000" } },
          delegatedFrozen: { energy: { amount: "38000000" } },
          unFrozen: {
            bandwidth: [{ amount: "1000000", expireTime: "2023-12-20T17:22:36.000Z" }],
            energy: [
              { amount: "10000000", expireTime: "2023-12-25T19:24:54.000Z" },
              { amount: "4000000", expireTime: "2023-12-25T19:25:09.000Z" },
            ],
          },
          legacyFrozen: {},
          votes: [{ address: "TAQpCTFeJvwdWf6MQZtXXkzWrTS9aymshb", voteCount: 100 }],
          tronPower: 591,
          energy: "214",
          bandwidth: { freeUsed: "0", freeLimit: "600", gainedUsed: "274", gainedLimit: "584" },
          unwithdrawnReward: "321945",
          lastWithdrawnRewardDate: "2023-11-24T16:58:09.000Z",
          lastVotedDate: "2023-12-06T17:24:48.000Z",
          cacheTransactionInfoById: {},
        },
        swapHistory: [],
      },
    },
  ],
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["tronjs"],
  currencies: {
    tron,
  },
};

testBridge(dataset);
