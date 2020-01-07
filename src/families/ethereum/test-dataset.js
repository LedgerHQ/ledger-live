// @flow
import { BigNumber } from "bignumber.js";
import type { DatasetTest } from "../../__tests__/test-helpers/bridge";
import { FeeTooHigh } from "@ledgerhq/errors";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["libcore", "mock", "ethereumjs"],
  currencies: {
    ethereum: {
      accounts: [
        {
          transactions: [
            {
              name: "success1",
              transaction: fromTransactionRaw({
                family: "ethereum",
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: "10000000000000",
                gasPrice: "100000000",
                userGasLimit: "21000",
                estimatedGasLimit: null,
                feeCustomUnit: null,
                networkInfo: null
              }),
              expectedStatus: {
                amount: BigNumber("10000000000000"),
                estimatedFees: BigNumber("2100000000000"),
                totalSpent: BigNumber("12100000000000"),
                errors: {},
                warnings: {
                  feeTooHigh: new FeeTooHigh()
                }
              }
            }
          ],
          raw: {
            id:
              "libcore:1:ethereum:xpub6BemYiVNp19ZzH73tAbE9guoQcyygwpWgmrch2J2WsbJhxUSnjZXpMnAKru6wXK3AWxU2fywYBCdojmwnFL6qiH3ByqXpDJ2PKGijdaNvAb:",
            seedIdentifier:
              "046575fa4cc4274a90599226af2493b8bdaf978674dc777bac4c3ef1667792d7339ef42ce783c0c4d83306720015473897508ef6029e7400869ea515526f4394c9",
            name: "Ethereum 1",
            derivationMode: "",
            index: 0,
            freshAddress: "0x519192a437e6aeb895Cec72828A73B11b698dE3a",
            freshAddressPath: "44'/60'/0'/0/0",
            pendingOperations: [],
            currencyId: "ethereum",
            unitMagnitude: 18,
            balance: "48167391707119",
            xpub:
              "xpub6BemYiVNp19ZzH73tAbE9guoQcyygwpWgmrch2J2WsbJhxUSnjZXpMnAKru6wXK3AWxU2fywYBCdojmwnFL6qiH3ByqXpDJ2PKGijdaNvAb",
            subAccounts: [],
            operations: [],
            freshAddresses: [
              {
                address: "0x519192a437e6aeb895Cec72828A73B11b698dE3a",
                derivationPath: "44'/60'/0'/0/0"
              }
            ],
            lastSyncDate: "",
            blockHeight: 0
          }
        },
        {
          raw: {
            id:
              "libcore:1:ethereum:xpub6BemYiVNp19a1XgWqLcpWd1pBDZTgzPEcVvhR15cpXPVQjuEnrU7fa3TUatX2NbRWNkqx51jmyukisqGokHq5dyK5uYcbwQBF7nJyAdpYZy:",
            seedIdentifier:
              "xpub6BemYiVNp19a1XgWqLcpWd1pBDZTgzPEcVvhR15cpXPVQjuEnrU7fa3TUatX2NbRWNkqx51jmyukisqGokHq5dyK5uYcbwQBF7nJyAdpYZy",
            name: "Ethereum legacy xpub6Bem...JyAdpYZy",
            derivationMode: "",
            index: 0,
            freshAddress: "0x0E3F0bb9516F01f2C34c25E0957518b8aC9414c5",
            freshAddressPath: "44'/60'/0'/0/0",
            freshAddresses: [],
            pendingOperations: [],
            operations: [],
            currencyId: "ethereum",
            unitMagnitude: 18,
            balance: "",
            blockHeight: 0,
            lastSyncDate: "",
            xpub:
              "xpub6BemYiVNp19a1XgWqLcpWd1pBDZTgzPEcVvhR15cpXPVQjuEnrU7fa3TUatX2NbRWNkqx51jmyukisqGokHq5dyK5uYcbwQBF7nJyAdpYZy"
          }
        }
      ]
    }
  }
};

export default dataset;
