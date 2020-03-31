// @flow
import { BigNumber } from "bignumber.js";
import type { DatasetTest } from "../../__tests__/test-helpers/bridge";
import {
  FeeTooHigh,
  GasLessThanEstimate,
  NotEnoughBalance
} from "@ledgerhq/errors";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";
import ethereumScanAccounts1 from "./datasets/ethereum.scanAccounts.1";
import ethereum_classic from "./datasets/ethereum_classic";
import { syncAccount } from "../../__tests__/test-helpers/bridge";

export const ethereum2 = {
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
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["libcore", "mock", "ethereumjs"],
  currencies: {
    ethereum: {
      scanAccounts: [ethereumScanAccounts1],
      accounts: [
        {
          implementations: ["libcore"],
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
            },
            {
              name: "Send token must succeed",
              transaction: fromTransactionRaw({
                family: "ethereum",
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                subAccountId:
                  "libcore:1:ethereum:xpub6BemYiVNp19a1XgWqLcpWd1pBDZTgzPEcVvhR15cpXPVQjuEnrU7fa3TUatX2NbRWNkqx51jmyukisqGokHq5dyK5uYcbwQBF7nJyAdpYZy:+0x9ab165D795019b6d8B3e971DdA91071421305e5a",
                amount: "800000000000000",
                userGasLimit: null,
                gasPrice: "0",
                estimatedGasLimit: null,
                feeCustomUnit: null,
                networkInfo: null
              }),
              expectedStatus: {
                amount: BigNumber("800000000000000"),
                estimatedFees: BigNumber("0"),
                totalSpent: BigNumber("800000000000000"),
                errors: {},
                warnings: {}
              }
            },
            {
              name: "Not enough gasLimit for token operation must warn",
              transaction: fromTransactionRaw({
                family: "ethereum",
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                subAccountId:
                  "libcore:1:ethereum:xpub6BemYiVNp19a1XgWqLcpWd1pBDZTgzPEcVvhR15cpXPVQjuEnrU7fa3TUatX2NbRWNkqx51jmyukisqGokHq5dyK5uYcbwQBF7nJyAdpYZy:+0x9ab165D795019b6d8B3e971DdA91071421305e5a",
                amount: "800000000000000",
                userGasLimit: "21000",
                gasPrice: "100",
                estimatedGasLimit: null,
                feeCustomUnit: null,
                networkInfo: null
              }),
              expectedStatus: {
                amount: BigNumber("800000000000000"),
                estimatedFees: BigNumber("2100000"),
                totalSpent: BigNumber("800000000000000"),
                errors: {},
                warnings: {
                  gasLimit: new GasLessThanEstimate()
                }
              }
            },
            {
              name: "Not enough token balance show an error",
              transaction: fromTransactionRaw({
                family: "ethereum",
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                subAccountId:
                  "libcore:1:ethereum:xpub6BemYiVNp19a1XgWqLcpWd1pBDZTgzPEcVvhR15cpXPVQjuEnrU7fa3TUatX2NbRWNkqx51jmyukisqGokHq5dyK5uYcbwQBF7nJyAdpYZy:+0x9ab165D795019b6d8B3e971DdA91071421305e5a",
                amount: "15000000000000000000",
                userGasLimit: "300000",
                gasPrice: "10",
                estimatedGasLimit: null,
                feeCustomUnit: null,
                networkInfo: null
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance()
                },
                warnings: {}
              }
            }
          ],
          test: async (expect, account, bridge) => {
            if (account.subAccounts) {
              const blacklistedTokenIds = [
                "ethereum/erc20/weth",
                "ethereum/erc20/amber_token",
                "ethereum/erc20/ampleforth"
              ];

              const rawTokenIds = account.subAccounts
                .map(sa => (sa.type === "TokenAccount" ? sa.token.id : ""))
                .filter(Boolean);

              const syncedAccount = await syncAccount(bridge, account, {
                paginationConfig: {},
                blacklistedTokenIds
              });

              const filteredTokenIds =
                syncedAccount.subAccounts &&
                syncedAccount.subAccounts
                  .map(sa => (sa.type === "TokenAccount" ? sa.token.id : ""))
                  .filter(Boolean);

              for (const tokenId of blacklistedTokenIds) {
                expect(rawTokenIds).toContain(tokenId);
                expect(filteredTokenIds).not.toContain(tokenId);
              }
            }
          },
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
            pendingOperations: [],
            currencyId: "ethereum",
            unitMagnitude: 18,
            balance: "2092658623260253",
            xpub:
              "xpub6BemYiVNp19a1XgWqLcpWd1pBDZTgzPEcVvhR15cpXPVQjuEnrU7fa3TUatX2NbRWNkqx51jmyukisqGokHq5dyK5uYcbwQBF7nJyAdpYZy",
            subAccounts: [],
            operations: [],
            freshAddresses: [
              {
                address: "0x0E3F0bb9516F01f2C34c25E0957518b8aC9414c5",
                derivationPath: "44'/60'/0'/0/0"
              }
            ],
            lastSyncDate: "",
            blockHeight: 0
          }
        },
        {
          raw: ethereum2
        }
      ]
    },
    ethereum_classic
  }
};

export default dataset;
