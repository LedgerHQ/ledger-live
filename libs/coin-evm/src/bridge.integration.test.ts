import { FeeTooHigh } from "@ledgerhq/errors";
import type { AccountRaw, CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import ethereumScanAccounts1 from "./datasets/ethereum.scanAccounts.1";
import { ethereum1 } from "./datasets/ethereum1";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";

const ethereum: CurrenciesData<Transaction> = {
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
              amount: BigNumber.max(account.balance.minus(status.estimatedFees), 0),
              errors: {},
              warnings: {},
            };
          },
        },
      ],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "js"],
  currencies: {
    ethereum,
  },
};

describe("EVM bridge", () => {
  test.todo(
    "This is an empty test to make jest command pass. Remove it once there is a real test.",
  );
});

/**
 * NOTE: if tests are added to this file,
 * like done in libs/coin-polkadot/src/bridge.integration.test.ts for example,
 * this file fill need to be imported in ledger-live-common
 * libs/ledger-live-common/src/families/algorand/bridge.integration.test.ts
 * like done for polkadot.
 * cf.
 * - libs/coin-polkadot/src/bridge.integration.test.ts
 * - libs/ledger-live-common/src/families/polkadot/bridge.integration.test.ts
 */
