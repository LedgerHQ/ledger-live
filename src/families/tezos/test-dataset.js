// @flow
import { NotEnoughBalance } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { fromTransactionRaw } from "../../transaction";
import type { DatasetTest } from "../dataset";

const dataset: DatasetTest = {
  implementations: ["libcore"],
  currencies: {
    tezos: {
      accounts: [
        {
          transactions: [
            {
              name: "to kt account",
              transaction: fromTransactionRaw({
                amount: "1000000",
                recipient: "KT1Mfe3rRhQw9KnEUZzoxkhmyHXBeN3zCzXL",
                useAllAmount: false,
                family: "tezos",
                mode: "send",
                networkInfo: {
                  family: "tezos",
                  fees: "1420"
                },
                fees: "1420",
                gasLimit: "10600",
                storageLimit: "300"
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
                estimatedFees: BigNumber("1420"),
                amount: BigNumber("1000000"),
                totalSpent: BigNumber("1001420")
              }
            },
            {
              name: "regular tx",
              transaction: fromTransactionRaw({
                amount: "1230000",
                recipient: "tz1ZshTmtorFVkcZ7CpceCAxCn7HBJqTfmpk",
                useAllAmount: false,
                family: "tezos",
                mode: "send",
                networkInfo: { family: "tezos", fees: "3075" },
                fees: "3075",
                gasLimit: "10600",
                storageLimit: "300"
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
                estimatedFees: BigNumber("3075"),
                amount: BigNumber("1230000"),
                totalSpent: BigNumber("1233075")
              }
            },
            {
              name: "not enough balance",
              transaction: fromTransactionRaw({
                amount: "12300000000",
                recipient: "tz1ZshTmtorFVkcZ7CpceCAxCn7HBJqTfmpk",
                useAllAmount: false,
                family: "tezos",
                mode: "send",
                networkInfo: { family: "tezos", fees: "3075" },
                fees: "3075",
                gasLimit: "10600",
                storageLimit: "300"
              }),
              expectedStatus: {
                errors: { amount: new NotEnoughBalance() },
                warnings: {},
                estimatedFees: BigNumber("0"),
                amount: BigNumber("12300000000"),
                totalSpent: BigNumber("12300000000")
              }
            },
            {
              name: "from KT to TZ",
              transaction: fromTransactionRaw({
                amount: "230000",
                recipient: "tz1ZshTmtorFVkcZ7CpceCAxCn7HBJqTfmpk",
                useAllAmount: false,
                subAccountId:
                  "libcore:1:tezos:020c38103f932f446dc4c09ac946e9643386609453e77716d3df45f1149aa52072:tezbox+KT1PTC8w6Mk6MSnx56TzMRx4Z8weLLq3oGgP",
                family: "tezos",
                mode: "send",
                networkInfo: { family: "tezos", fees: "3213" },
                fees: "3213",
                gasLimit: "10600",
                storageLimit: "300"
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
                estimatedFees: BigNumber("3213"),
                amount: BigNumber("230000"),
                totalSpent: BigNumber("233213")
              }
            },
            {
              name: "send max",
              transaction: fromTransactionRaw({
                amount: "0",
                recipient: "tz1ZshTmtorFVkcZ7CpceCAxCn7HBJqTfmpk",
                useAllAmount: true,
                family: "tezos",
                mode: "send",
                networkInfo: { family: "tezos", fees: "64433" },
                fees: "64433",
                gasLimit: "10600",
                storageLimit: "300"
              }),
              expectedStatus: {
                errors: {},
                warnings: {}
              }
            },
            {
              name: "delegate",
              transaction: fromTransactionRaw({
                amount: "1000",
                recipient: "tz1ZshTmtorFVkcZ7CpceCAxCn7HBJqTfmpk",
                useAllAmount: false,
                family: "tezos",
                mode: "delegate",
                networkInfo: { family: "tezos", fees: "4495" },
                fees: "4495",
                gasLimit: "10600",
                storageLimit: "300"
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
                estimatedFees: BigNumber("4495"),
                amount: BigNumber("1000"),
                totalSpent: BigNumber("5495")
              }
            }
          ],
          raw: {
            id:
              "libcore:1:tezos:020c38103f932f446dc4c09ac946e9643386609453e77716d3df45f1149aa52072:tezbox",
            seedIdentifier:
              "02706dbe651d40b272e6bfe66d1ff466b490e262c223f48bd140b95898adce8965",
            name: "Tezos 1 (tezbox)",
            derivationMode: "tezbox",
            index: 0,
            freshAddress: "tz1TeawWFnUmeP1qQLf4JWe5D7LaNp1qxgMW",
            freshAddressPath: "44'/1729'/0'/0'",
            freshAddresses: [
              {
                address: "tz1TeawWFnUmeP1qQLf4JWe5D7LaNp1qxgMW",
                derivationPath: "44'/1729'/0'/0'"
              }
            ],
            blockHeight: 671368,
            operations: [],
            pendingOperations: [],
            currencyId: "tezos",
            unitMagnitude: 6,
            lastSyncDate: "2019-10-29T20:25:33.095Z",
            balance: "30963414",
            xpub:
              "020c38103f932f446dc4c09ac946e9643386609453e77716d3df45f1149aa52072",
            subAccounts: []
          }
        }
      ]
    }
  }
};

export default dataset;
