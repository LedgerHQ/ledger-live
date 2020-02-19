// @flow
import invariant from "invariant";
import {
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecommendUndelegation,
  NotSupportedLegacyAddress
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { fromTransactionRaw } from "./transaction";
import type { DatasetTest } from "../../__tests__/test-helpers/bridge";
import type { Transaction } from "./types";
import tezosScanAccounts1 from "./datasets/tezos.scanAccounts.1.js";

export const accountTZrevealedDelegating = makeAccount(
  "TZrevealedDelegating",
  "02389ffd73423626894cb151416e51c72ec285376673daf83545eb5edb45b261ce",
  "tezbox"
);

const accountTZwithKT = makeAccount(
  "TZwithKT",
  "0294e8344ae6df2d3123fa100b5abd40cee339c67838b1c34c4f243cc582f4d2d8",
  "tezbox"
);

const accountTZnew = makeAccount(
  "TZnew",
  "02a9ae8b0ff5f9a43565793ad78e10db6f12177d904d208ada591b8a5b9999e3fd",
  "tezbox"
);
const accountTZnotRevealed = makeAccount(
  "TZnotRevealed",
  "020162dc75ad3c2b6e097d15a1513033c60d8a033f2312ff5a6ead812228d9d653",
  "tezosbip44h"
);
const accountTZRevealedNoDelegate = makeAccount(
  "TZRevealedNoDelegate",
  "029bfe70b3e94ff23623f6c42f6e081a9ca8cc78f74b0d8da58f0d4cdc41c33c1a",
  "tezosbip44h"
);

const accountTZemptyWithKT = makeAccount(
  "TZemptyWithKT",
  "020c38103f932f446dc4c09ac946e9643386609453e77716d3df45f1149aa52072",
  "tezbox"
);

const addressAccountTZrevealedDelegating =
  "tz1boBHAVpwcvKkNFAQHYr7mjxAz1PpVgKq7";
const addressTZregular = "tz1T72nyqnJWwxad6RQnh7imKQz7mzToamWd";
const addressTZnew = "tz1VSichevvJSNkSSntgwKDKikWNB6iqNJii";
const addressKT = "KT1V99vDN5DHNpU9swVXg1cAT2ji981cccXC";
const addressDelegator = "tz1WCd2jm4uSt4vntk4vSuUWoZQGhLcDuR9q";

const reservedAmountForStorageLimit = storageLimit =>
  BigNumber(storageLimit || 0).times("1000");

const dataset: DatasetTest<Transaction> = {
  implementations: ["libcore"],
  currencies: {
    tezos: {
      FIXME_ignoreOperationFields: ["blockHeight"],
      scanAccounts: [tezosScanAccounts1],
      accounts: [
        {
          raw: accountTZrevealedDelegating,
          transactions: [
            {
              name: "send max to new account (explicit)",
              transaction: fromTransactionRaw({
                amount: "0",
                recipient: addressTZnew,
                useAllAmount: true,
                family: "tezos",
                mode: "send",
                networkInfo: { family: "tezos", fees: "3075" },
                fees: "3075",
                gasLimit: "10600",
                storageLimit: "300"
              }),
              expectedStatus: account => ({
                errors: {},
                warnings: {
                  amount: new RecommendUndelegation()
                },
                estimatedFees: BigNumber("3075"),
                amount: account.balance
                  .minus(reservedAmountForStorageLimit("300"))
                  .minus("3075"),
                totalSpent: account.balance
              })
            },
            {
              name: "overflow send to new account",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance.minus(t.fees || 0).minus("1000"),
                recipient: addressTZnew
              }),
              expectedStatus: {
                errors: { amount: new NotEnoughBalance() },
                warnings: {}
              }
            },
            {
              name: "send max to new account (dynamic)",
              transaction: t => ({
                ...t,
                recipient: addressTZnew,
                useAllAmount: true
              }),
              expectedStatus: (account, { storageLimit, fees }) => (
                invariant(fees, "fees are required"),
                {
                  errors: {},
                  warnings: {
                    amount: new RecommendUndelegation()
                  },
                  estimatedFees: fees,
                  amount: account.balance
                    .minus(reservedAmountForStorageLimit(storageLimit))
                    .minus(fees),
                  totalSpent: account.balance
                }
              )
            },
            {
              name: "send max to existing account",
              transaction: t => ({
                ...t,
                recipient: addressTZregular,
                useAllAmount: true
              }),
              expectedStatus: (account, { fees }) => (
                invariant(fees, "fees are required"),
                {
                  errors: {},
                  warnings: {
                    amount: new RecommendUndelegation()
                  },
                  estimatedFees: fees,
                  amount: account.balance.minus(fees),
                  totalSpent: account.balance
                }
              )
            },
            {
              name: "self tx forbidden",
              transaction: t => ({
                ...t,
                recipient: addressAccountTZrevealedDelegating,
                amount: BigNumber(0.1)
              }),
              expectedStatus: {
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource()
                },
                warnings: {}
              }
            },
            {
              name: "undelegate",
              transaction: t => ({
                ...t,
                mode: "undelegate"
              }),
              expectedStatus: (account, { fees }) => (
                invariant(fees, "fees are required"),
                {
                  errors: {},
                  warnings: {},
                  amount: BigNumber(0),
                  estimatedFees: fees
                }
              )
            }
          ]
        },

        {
          raw: accountTZRevealedNoDelegate,
          transactions: [
            {
              name: "send max to new account",
              transaction: t => ({
                ...t,
                recipient: addressTZnew,
                useAllAmount: true
              }),
              expectedStatus: (account, { storageLimit, fees }) => (
                invariant(fees, "fees are required"),
                {
                  errors: {},
                  warnings: {},
                  estimatedFees: fees,
                  amount: account.balance
                    .minus(reservedAmountForStorageLimit(storageLimit))
                    .minus(fees),
                  totalSpent: account.balance
                }
              )
            },
            {
              name: "send max to existing account",
              transaction: t => ({
                ...t,
                recipient: addressTZregular,
                useAllAmount: true
              }),
              expectedStatus: (account, { fees }) => (
                invariant(fees, "fees are required"),
                {
                  errors: {},
                  warnings: {},
                  estimatedFees: fees,
                  amount: account.balance.minus(fees),
                  totalSpent: account.balance
                }
              )
            },
            {
              name: "delegate",
              transaction: t => ({
                ...t,
                recipient: addressDelegator,
                mode: "delegate"
              }),
              expectedStatus: (account, { fees }) => (
                invariant(fees, "fees are required"),
                {
                  errors: {},
                  warnings: {},
                  amount: BigNumber(0),
                  estimatedFees: fees
                }
              )
            }
          ]
        },

        {
          raw: accountTZnotRevealed,
          transactions: [
            {
              name: "send 10% to KT",
              transaction: (t, account) => ({
                ...t,
                recipient: addressKT,
                amount: account.balance.div(10)
              }),
              expectedStatus: {
                errors: { recipient: new NotSupportedLegacyAddress() },
                warnings: {}
              }
            },
            {
              name: "send 10% to existing tz",
              transaction: (t, account) => ({
                ...t,
                recipient: addressTZnew,
                amount: account.balance.div(10)
              }),
              expectedStatus: (account, { fees }) => (
                invariant(fees, "fees are required"),
                {
                  errors: {},
                  warnings: {},
                  estimatedFees: fees.times(2),
                  amount: account.balance.div(10),
                  totalSpent: account.balance.div(10).plus(fees.times(2))
                }
              )
            }
          ]
        },

        {
          raw: accountTZnew,
          test: (expect, account) => {
            expect(account.operations).toEqual([]);
          },
          transactions: [
            {
              name: "send 10% to existing tz",
              transaction: t => ({
                ...t,
                recipient: addressTZregular,
                useAllAmount: true
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance()
                },
                warnings: {}
              }
            }
          ]
        },

        {
          FIXME_tests: [
            "balance is sum of ops",
            // because of prev bug we have bug on
            "from KT 2, send max to existing account"
          ],
          raw: accountTZwithKT,
          transactions: [
            {
              name: "from KT 1, send max to new account",
              transaction: (t, account) => (
                invariant(account.subAccounts, "subAccounts"),
                {
                  ...t,
                  subAccountId: account.subAccounts[0].id,
                  recipient: addressTZnew,
                  useAllAmount: true
                }
              ),
              expectedStatus: ({ subAccounts }, { storageLimit, fees }) => (
                invariant(fees && subAccounts, "fees are required"),
                {
                  errors: {},
                  warnings: {},
                  estimatedFees: fees,
                  amount: subAccounts[0].balance.minus(
                    reservedAmountForStorageLimit(storageLimit)
                  ),
                  totalSpent: subAccounts[0].balance
                }
              )
            },
            {
              name: "from KT 2, send max to existing account",
              transaction: (t, account) => (
                invariant(
                  account.subAccounts && account.subAccounts[1],
                  "subAccounts"
                ),
                {
                  ...t,
                  subAccountId: account.subAccounts[1].id,
                  recipient: addressTZnew,
                  useAllAmount: true
                }
              ),
              expectedStatus: ({ subAccounts }, { fees, storageLimit }) => (
                invariant(
                  subAccounts && fees && storageLimit,
                  "fees are required"
                ),
                {
                  errors: {},
                  warnings: {},
                  estimatedFees: fees,
                  amount: subAccounts[1].balance,
                  totalSpent: subAccounts[1].balance
                }
              )
            }
          ]
        },
        {
          raw: accountTZemptyWithKT,
          transactions: [
            {
              name: "from KT 1, send max",
              transaction: (t, account) => (
                invariant(account.subAccounts, "subAccounts"),
                {
                  ...t,
                  subAccountId: account.subAccounts[0].id,
                  recipient: addressTZregular,
                  useAllAmount: true
                }
              ),
              expectedStatus: {
                errors: { amount: new NotEnoughBalanceInParentAccount() },
                warnings: {}
              }
            },

            {
              name: "from KT 1, send 10%",
              transaction: (t, account) => (
                invariant(account.subAccounts, "subAccounts"),
                {
                  ...t,
                  subAccountId: account.subAccounts[0].id,
                  amount: account.balance.div(10),
                  recipient: addressTZregular
                }
              ),
              expectedStatus: {
                errors: { amount: new NotEnoughBalanceInParentAccount() },
                warnings: {}
              }
            }
          ]
        }
      ]
    }
  }
};

export default dataset;

function makeAccount(name, pubKey, derivationMode) {
  return {
    id: `libcore:1:tezos:${pubKey}:${derivationMode}`,
    seedIdentifier: pubKey,
    name: "Tezos " + name,
    derivationMode,
    index: 0,
    freshAddress: "",
    freshAddressPath: "",
    freshAddresses: [],
    blockHeight: 0,
    operations: [],
    pendingOperations: [],
    currencyId: "tezos",
    unitMagnitude: 6,
    lastSyncDate: "",
    balance: "0",
    xpub: pubKey,
    subAccounts: []
  };
}
