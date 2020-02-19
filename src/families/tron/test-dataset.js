// @flow
import { BigNumber } from "bignumber.js";
import type { DatasetTest } from "../../__tests__/test-helpers/bridge";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";
import {
  AmountRequired,
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource
} from "@ledgerhq/errors";
import {
  NoFrozenForBandwidth,
  NoFrozenForEnergy,
  NoReward,
  InvalidFreezeAmount,
  InvalidVoteCount,
  NotEnoughTronPower,
  SendTrc20ToNewAccountForbidden,
  VoteRequired,
  UnexpectedFees
} from "../../errors";

const dataset: DatasetTest<Transaction> = {
  implementations: ["tronjs"],
  currencies: {
    tron: {
      FIXME_ignoreAccountFields: [
        "tronResources.energy",
        "tronResources.unwithdrawnReward"
      ],
      scanAccounts: [
        {
          name: "tron seed 1",
          apdus: `
            => e002000009028000002c800000c3
            <= 4104b335b4482e37137a335d302242fc5e450c16f9712665f25049646208779987fd6deaccb2444614ba4f5085ffe436b41314ace1bc553b7112b092fb6a2559935d22544e784b5265514648395735654e503763465a453352454c4254627377397954674c9000
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
          `
        }
      ],
      accounts: [
        {
          transactions: [
            {
              name: "sendSuccess",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
                amount: "1000000",
                networkInfo: null,
                mode: "send",
                duration: undefined,
                resource: undefined,
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("1000000"),
                errors: {},
                warnings: {},
                totalSpent: BigNumber("1000000"),
                estimatedFees: BigNumber("0")
              }
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
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("1000000"),
                errors: {},
                warnings: {},
                totalSpent: BigNumber("1000000"),
                estimatedFees: BigNumber("0")
              }
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
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("1000000"),
                errors: {},
                warnings: {},
                totalSpent: BigNumber("1000000"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "voteSuccess",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
                amount: "0",
                networkInfo: null,
                mode: "vote",
                duration: undefined,
                resource: undefined,
                votes: [
                  {
                    address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
                    voteCount: 1
                  },
                  {
                    address: "TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U",
                    voteCount: 1
                  }
                ]
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: {},
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
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
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("1000000"),
                errors: { recipient: new RecipientRequired() },
                warnings: {},
                totalSpent: BigNumber("1000000"),
                estimatedFees: BigNumber("0")
              }
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
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("1000000"),
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource()
                },
                warnings: {},
                totalSpent: BigNumber("1000000"),
                estimatedFees: BigNumber("0")
              }
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
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("1000000"),
                errors: { recipient: new InvalidAddress() },
                warnings: {},
                totalSpent: BigNumber("1000000"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "amountRequired",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
                amount: "0",
                networkInfo: null,
                mode: "send",
                duration: undefined,
                resource: undefined,
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: { amount: new AmountRequired() },
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "notEnoughBalance",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
                amount: "1000000000",
                networkInfo: null,
                mode: "send",
                duration: undefined,
                resource: undefined,
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("1000000000"),
                errors: { amount: new NotEnoughBalance() },
                warnings: {},
                totalSpent: BigNumber("1000000000"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "estimatedFeesWarning", // send 1TRX to new account = +0.1TRX of fees
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "TXFeV31qgUQYMLog3axKJeEBbXpQFtHsXD",
                amount: "1000000",
                networkInfo: null,
                mode: "send",
                duration: undefined,
                resource: undefined,
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("1000000"),
                errors: {},
                warnings: { fee: new UnexpectedFees("Estimated fees") },
                totalSpent: BigNumber("1100000"),
                estimatedFees: BigNumber("100000")
              }
            },
            {
              name: "sendTrc20ToNewAccountForbidden",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "TXFeV31qgUQYMLog3axKJeEBbXpQFtHsXD",
                subAccountId:
                  "tronjs:2:tron:THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi:+TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
                amount: "1000000",
                networkInfo: null,
                mode: "send",
                duration: undefined,
                resource: undefined,
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("1000000"),
                errors: { recipient: new SendTrc20ToNewAccountForbidden() },
                warnings: {},
                totalSpent: BigNumber("1000000"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "invalidFreezeAmount",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "",
                amount: "100000",
                networkInfo: null,
                mode: "freeze",
                duration: undefined,
                resource: "BANDWIDTH",
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("100000"),
                errors: { amount: new InvalidFreezeAmount() },
                warnings: {},
                totalSpent: BigNumber("100000"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "noFrozenForEnergy",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "",
                amount: "0",
                networkInfo: null,
                mode: "unfreeze",
                duration: undefined,
                resource: "ENERGY",
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: { resource: new NoFrozenForEnergy() },
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "voteRequired",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "",
                amount: "0",
                networkInfo: null,
                mode: "vote",
                duration: undefined,
                resource: undefined,
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: { vote: new VoteRequired() },
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "invalidVoteAddress",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
                amount: "0",
                networkInfo: null,
                mode: "vote",
                duration: undefined,
                resource: undefined,
                votes: [{ address: "abcde", voteCount: 1 }]
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: { vote: new InvalidAddress() },
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "invalidVoteCount",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
                amount: "0",
                networkInfo: null,
                mode: "vote",
                duration: undefined,
                resource: undefined,
                votes: [
                  {
                    address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
                    voteCount: 0
                  }
                ]
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: { vote: new InvalidVoteCount() },
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "notEnoughTronPower",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
                amount: "0",
                networkInfo: null,
                mode: "vote",
                duration: undefined,
                resource: undefined,
                votes: [
                  {
                    address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
                    voteCount: 5
                  },
                  {
                    address: "TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U",
                    voteCount: 4
                  }
                ]
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: { vote: new NotEnoughTronPower() },
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "noReward",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "",
                amount: "0",
                networkInfo: null,
                mode: "claimReward",
                duration: undefined,
                resource: undefined,
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: { reward: new NoReward() },
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
            }
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
                derivationPath: "44'/195'/0'/0/0"
              }
            ],
            lastSyncDate: "",
            blockHeight: 0
          }
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
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: {},
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
            },
            {
              name: "noFrozenForBandwidth",
              transaction: fromTransactionRaw({
                family: "tron",
                recipient: "",
                amount: "0",
                networkInfo: null,
                mode: "unfreeze",
                duration: undefined,
                resource: "BANDWIDTH",
                votes: []
              }),
              expectedStatus: {
                amount: BigNumber("0"),
                errors: { resource: new NoFrozenForBandwidth() },
                warnings: {},
                totalSpent: BigNumber("0"),
                estimatedFees: BigNumber("0")
              }
            }
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
            "balance is sum of ops"
          ],
          raw: {
            id: "js:2:tron:TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9:",
            seedIdentifier: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
            name: "Tron 1",
            derivationMode: "",
            index: 0,
            freshAddress: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
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
                address: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
                derivationPath: "44'/195'/0'/0/0"
              }
            ],
            lastSyncDate: "",
            blockHeight: 0
          }
        }
      ]
    }
  }
};

export default dataset;
