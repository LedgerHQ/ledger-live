// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { DatasetTest } from "../../types";
import {
  FeeTooHigh,
  GasLessThanEstimate,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";
// import ethereumScanAccounts1 from "./datasets/ethereum.scanAccounts.1";
import ethereum_classic from "./datasets/ethereum_classic";
import { syncAccount } from "../../__tests__/test-helpers/bridge";

export const ethereum1 = {
  id: "js:1:ethereum:0x0E3F0bb9516F01f2C34c25E0957518b8aC9414c5:",
  seedIdentifier: "0x0E3F0bb9516F01f2C34c25E0957518b8aC9414c5",
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
  xpub: "",
};

const expectedTokenAccount = (a) => {
  invariant(a && a.type === "TokenAccount", "expected token account");
  return a;
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "js"],
  currencies: {
    ethereum: {
      scanAccounts: [], // FIXME https://ledgerhq.atlassian.net/browse/LL-6445
      // scanAccounts: [ethereumScanAccounts1],
      accounts: [
        {
          implementations: ["js"],
          transactions: [
            {
              name: "success1",
              transaction: fromTransactionRaw({
                family: "ethereum",
                mode: "send",
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: "10000000000000",
                gasPrice: "100000000",
                userGasLimit: "21000",
                estimatedGasLimit: null,
                feeCustomUnit: null,
                networkInfo: null,
              }),
              expectedStatus: {
                amount: BigNumber("10000000000000"),
                estimatedFees: BigNumber("2100000000000"),
                totalSpent: BigNumber("12100000000000"),
                errors: {},
                warnings: {
                  feeTooHigh: new FeeTooHigh(),
                },
              },
            },
            {
              name: "Send token must succeed",
              transaction: (t, account) => ({
                ...t,
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: BigNumber("800000000000000"),
                subAccountId: expectedTokenAccount(
                  (account.subAccounts || []).find(
                    (a) =>
                      expectedTokenAccount(a).token.id ===
                      "ethereum/erc20/aurora"
                  )
                ).id,
              }),
              expectedStatus: {
                amount: BigNumber("800000000000000"),
                totalSpent: BigNumber("800000000000000"),
                errors: {},
                warnings: {},
              },
            },
            {
              name: "Not enough gasLimit for token operation must warn",
              transaction: (t, account) => ({
                ...t,
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: BigNumber("800000000000000"),
                userGasLimit: BigNumber("21000"),
                gasPrice: BigNumber("100"),
                feesStrategy: null,
                subAccountId: expectedTokenAccount(
                  (account.subAccounts || []).find(
                    (a) =>
                      expectedTokenAccount(a).token.id ===
                      "ethereum/erc20/aurora"
                  )
                ).id,
              }),
              expectedStatus: {
                amount: BigNumber("800000000000000"),
                estimatedFees: BigNumber("2100000"),
                totalSpent: BigNumber("800000000000000"),
                errors: {},
                warnings: {
                  gasLimit: new GasLessThanEstimate(),
                },
              },
            },
            {
              name: "Not enough token balance show an error",
              transaction: (t, account) => ({
                ...t,
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: BigNumber("15000000000000000000"),
                userGasLimit: BigNumber("300000"),
                gasPrice: BigNumber("10"),
                subAccountId: expectedTokenAccount(
                  (account.subAccounts || []).find(
                    (a) =>
                      expectedTokenAccount(a).token.id ===
                      "ethereum/erc20/aurora"
                  )
                ).id,
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
          ],
          test: async (expect, account, bridge) => {
            if (account.subAccounts) {
              const blacklistedTokenIds = [
                "ethereum/erc20/weth",
                "ethereum/erc20/amber_token",
              ];

              const rawTokenIds = account.subAccounts
                .map((sa) => (sa.type === "TokenAccount" ? sa.token.id : ""))
                .filter(Boolean);

              const syncedAccount = await syncAccount(bridge, account, {
                paginationConfig: {},
                blacklistedTokenIds,
              });

              const filteredTokenIds =
                syncedAccount.subAccounts &&
                syncedAccount.subAccounts
                  .map((sa) => (sa.type === "TokenAccount" ? sa.token.id : ""))
                  .filter(Boolean);

              for (const tokenId of blacklistedTokenIds) {
                expect(rawTokenIds).toContain(tokenId);
                expect(filteredTokenIds).not.toContain(tokenId);
              }
            }
          },
          raw: ethereum1,
        },
      ],
    },
    ethereum_classic,
  },
};

export default dataset;
