/**
 * ⚠️ In order to test this file, you must run the test from the live-common repo
 */

import { BigNumber } from "bignumber.js";
import { FeeNotLoaded, NotEnoughBalance } from "@ledgerhq/errors";
import type { AccountRaw, DatasetTest } from "@ledgerhq/types-live";
import { fromTransactionRaw } from "../../transaction";
import { ethereum1 } from "../../datasets/ethereum1";
import type { Transaction } from "../../types";

export const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "js"],
  currencies: {
    ethereum_as_evm_test_only: {
      accounts: [
        {
          FIXME_tests: ["balance is sum of ops"],
          implementations: ["js"],
          raw: ethereum1 as AccountRaw,
          transactions: [
            {
              name: "Send",
              transaction: fromTransactionRaw({
                family: "evm",
                mode: "send",
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: (1e19).toString(), // 10 ETH
                gasPrice: "0",
                gasLimit: "21000",
                chainId: 1,
                nonce: 0,
              }),
              expectedStatus: (account, transaction) => {
                const estimatedFees = transaction.gasLimit.times(transaction.maxFeePerGas || 0);
                return {
                  amount: new BigNumber(1e19), // 10 ETH
                  estimatedFees, // fees are calculated during preparation and therefore cannot be guessed without mocks
                  totalSpent: new BigNumber(1e19).plus(estimatedFees), // fees are calculated during preparation and therefore cannot be guessed without mocks
                  errors: {
                    amount: new NotEnoughBalance(), // "The parent account balance is insufficient for network fees" since account is empty
                    gasLimit: new FeeNotLoaded(), // "Could not load fee rates. Please set manual fees" because gas estimation failed as the account is empty
                  },
                  warnings: {},
                };
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
                  amount: BigNumber.max(account.balance.minus(status.estimatedFees), 0),
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
