import "../../__tests__/test-helpers/setup";

import { BigNumber } from "bignumber.js";
import type { AccountRaw, DatasetTest } from "@ledgerhq/types-live";
import { FeeTooHigh } from "@ledgerhq/errors";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import ethereumScanAccounts1 from "./datasets/ethereum.scanAccounts.1";
import { ethereum1 } from "./datasets/ethereum1";

const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "js"],
  currencies: {
    ethereum: {
      scanAccounts: [ethereumScanAccounts1],
      accounts: [
        {
          implementations: ["js"],
          raw: ethereum1 as AccountRaw,
          transactions: [
            {
              name: "Send",
              transaction: fromTransactionRaw({
                family: "evm",
                mode: "send",
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: "10000000000000",
                gasPrice: "100000000",
                gasLimit: "21000",
                chainId: 1,
                nonce: 0,
              }),
              expectedStatus: {
                amount: new BigNumber(10000000000000),
                estimatedFees: new BigNumber(2100000000000),
                totalSpent: new BigNumber(12100000000000),
                errors: {},
                warnings: {
                  feeTooHigh: new FeeTooHigh(),
                },
              },
            },
            {
              name: "Send max",
              transaction: fromTransactionRaw({
                family: "evm",
                mode: "send",
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: "1",
                gasPrice: "100000000",
                gasLimit: "21000",
                chainId: 1,
                nonce: 0,
                useAllAmount: true,
              }),
              expectedStatus: (account, _, status) => {
                return {
                  amount: BigNumber.max(
                    account.balance.minus(status.estimatedFees),
                    0
                  ),
                  errors: {},
                  warnings: {},
                };
              },
            },
          ],
        },
      ],
    },
  },
};

testBridge(dataset);
