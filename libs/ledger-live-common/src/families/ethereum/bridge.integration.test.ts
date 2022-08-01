import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { AccountRaw, DatasetTest } from "@ledgerhq/types-live";
import {
  FeeTooHigh,
  GasLessThanEstimate,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";
import ethereumScanAccounts1 from "./datasets/ethereum.scanAccounts.1";
import ethereum_classic from "./datasets/ethereum_classic";
import { syncAccount } from "../../__tests__/test-helpers/bridge";
import { ethereum1 } from "./datasets/ethereum1";

const expectedTokenAccount = (a) => {
  invariant(a && a.type === "TokenAccount", "expected token account");
  return a;
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "js"],
  currencies: {
    ethereum: {
      scanAccounts: [ethereumScanAccounts1],
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
                amount: new BigNumber("10000000000000"),
                estimatedFees: new BigNumber("2100000000000"),
                totalSpent: new BigNumber("12100000000000"),
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
                amount: new BigNumber("800000000000000"),
                subAccountId: expectedTokenAccount(
                  (account.subAccounts || []).find(
                    (a) =>
                      expectedTokenAccount(a).token.id ===
                      "ethereum/erc20/aurora"
                  )
                ).id,
              }),
              expectedStatus: {
                amount: new BigNumber("800000000000000"),
                totalSpent: new BigNumber("800000000000000"),
                errors: {},
                warnings: {},
              },
            },
            {
              name: "Not enough gasLimit for token operation must warn",
              transaction: (t, account) => ({
                ...t,
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: new BigNumber("800000000000000"),
                userGasLimit: new BigNumber("21000"),
                gasPrice: new BigNumber("100"),
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
                amount: new BigNumber("800000000000000"),
                estimatedFees: new BigNumber("2100000"),
                totalSpent: new BigNumber("800000000000000"),
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
                amount: new BigNumber("15000000000000000000"),
                userGasLimit: new BigNumber("300000"),
                gasPrice: new BigNumber("10"),
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
          raw: ethereum1 as AccountRaw,
        },
      ],
    },
    ethereum_classic,
  },
};

testBridge(dataset);
