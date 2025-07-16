import BigNumber from "bignumber.js";
import type {
  AccountRaw,
  CurrenciesData,
  DatasetTest,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "../bridge/transaction";
import { MAINNET_CHAIN_TAG } from "../types";
import { vechain1, vechain3 } from "../datasets";
import { generateNonce } from "../common-logic";

import vechainScanAccounts1 from "../datasets/vechain.scanAccounts.1";
import { AmountRequired, NotEnoughBalance } from "@ledgerhq/errors";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { NotEnoughVTHO } from "../errors";
import {
  listSupportedCurrencies,
  setSupportedCurrencies,
} from "@ledgerhq/coin-framework/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { ABIContract, VIP180_ABI } from "@vechain/sdk-core";

const listSupported = listSupportedCurrencies();
listSupported.push(getCryptoCurrencyById("vechain"));
setSupportedCurrencies(listSupported.map(c => c.id) as CryptoCurrencyId[]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const vechain: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["balance", "spendableBalance", "estimateMaxSpendable"], // the balance depends on VTHO and it's earned without operations
  scanAccounts: vechainScanAccounts1,

  accounts: [
    {
      raw: vechain1 as AccountRaw,
      transactions: [
        {
          name: "Send VET",
          transaction: fromTransactionRaw({
            family: "vechain",
            estimatedFees: "210000000000000000",
            recipient: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
            amount: (1e18).toString(), // 1 VET
            body: {
              chainTag: MAINNET_CHAIN_TAG,
              blockRef: "0x00634a0c856ec1db",
              expiration: 18,
              clauses: [
                {
                  to: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                  value: (1e18).toString(), // 1 VET
                  data: "0x",
                },
              ],
              gas: "0",
              maxFeePerGas: 0,
              maxPriorityFeePerGas: 0,
              dependsOn: null,
              nonce: generateNonce(),
            },
          }),
          expectedStatus: (_account, _, status): Partial<TransactionStatusCommon> => {
            const estimatedFees = status.estimatedFees;
            return {
              amount: new BigNumber(1e18), // 1 VET
              estimatedFees, // fees are calculated during preparation and therefore cannot be guessed without mocks
              totalSpent: new BigNumber(1e18),
              errors: {},
              warnings: {},
            };
          },
        },
        {
          name: "Send VTHO",
          transaction: fromTransactionRaw({
            family: "vechain",
            subAccountId:
              "js:2:vechain:0x0fe6688548f0C303932bB197B0A96034f1d74dba:vechain+vechain%2Fvip180%2Fvtho",
            estimatedFees: "515180000000000000",
            recipient: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
            amount: (1e19).toString(), // 10 VTHO
            body: {
              chainTag: MAINNET_CHAIN_TAG,
              blockRef: "0x00634a0c856ec1db",
              expiration: 18,
              clauses: [
                {
                  to: "0x0000000000000000000000000000456e65726779",
                  value: 0,
                  data: ABIContract.ofAbi(VIP180_ABI)
                    .encodeFunctionInput("transfer", [
                      "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                      "9000000000000000000",
                    ])
                    .toString(),
                },
              ],
              gas: "0",
              maxFeePerGas: 0,
              maxPriorityFeePerGas: 0,
              dependsOn: null,
              nonce: generateNonce(),
            },
          }),
          expectedStatus: (_account, _, status): Partial<TransactionStatusCommon> => {
            const estimatedFees = status.estimatedFees;
            return {
              amount: new BigNumber(1e19), // 10 VTHO
              estimatedFees, // fees are calculated during preparation and therefore cannot be guessed without mocks
              totalSpent: new BigNumber(1e19).plus(estimatedFees), // fees are calculated during preparation and therefore cannot be guessed without mocks
              errors: {},
              warnings: {},
            };
          },
        },
        {
          name: "Amount required",
          transaction: fromTransactionRaw({
            family: "vechain",
            estimatedFees: "0",
            recipient: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
            amount: "",
            body: {
              chainTag: MAINNET_CHAIN_TAG,
              blockRef: "0x00634a0c856ec1db",
              expiration: 18,
              clauses: [{ to: "", value: 0, data: "0x" }],
              gas: "0",
              maxFeePerGas: 0,
              maxPriorityFeePerGas: 0,
              dependsOn: null,
              nonce: generateNonce(),
            },
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "VET balance not enough",
          transaction: fromTransactionRaw({
            family: "vechain",
            estimatedFees: "210000000000000000",
            recipient: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
            amount: (2e19).toString(), // 20 VET
            body: {
              chainTag: MAINNET_CHAIN_TAG,
              blockRef: "0x00634a0c856ec1db",
              expiration: 18,
              clauses: [
                {
                  to: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                  value: (2e19).toString(), // 20 VET
                  data: "0x",
                },
              ],
              gas: "0",
              maxFeePerGas: 0,
              maxPriorityFeePerGas: 0,
              dependsOn: null,
              nonce: generateNonce(),
            },
          }),
          expectedStatus: (_account, _, status): Partial<TransactionStatusCommon> => {
            const estimatedFees = status.estimatedFees;
            return {
              amount: new BigNumber(2e19), // 20 VET
              errors: {
                amount: new NotEnoughBalance(),
              },
              warnings: {},
              totalSpent: new BigNumber(2e19),
              estimatedFees, // fees are calculated during preparation and therefore cannot be guessed without mocks
            };
          },
        },
        {
          name: "VTHO balance not enough",
          transaction: fromTransactionRaw({
            family: "vechain",
            subAccountId:
              "js:2:vechain:0x0fe6688548f0C303932bB197B0A96034f1d74dba:vechain+vechain%2Fvip180%2Fvtho",
            estimatedFees: "515820000000000000",
            recipient: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
            amount: (2e19).toString(), // 20 VTHO
            body: {
              chainTag: MAINNET_CHAIN_TAG,
              blockRef: "0x00634a0c856ec1db",
              expiration: 18,
              clauses: [
                {
                  to: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                  value: (2e19).toString(), // 20 VTHO
                  data: "0x",
                },
              ],
              gas: "0",
              maxFeePerGas: 0,
              maxPriorityFeePerGas: 0,
              dependsOn: null,
              nonce: generateNonce(),
            },
          }),
          expectedStatus: (_account, _, status): Partial<TransactionStatusCommon> => {
            const estimatedFees = status.estimatedFees;
            return {
              amount: new BigNumber(2e19), // 20 VTHO
              errors: {
                amount: new NotEnoughBalance(),
              },
              warnings: {},
              totalSpent: new BigNumber(2e19).plus(estimatedFees),
              estimatedFees, // fees are calculated during preparation and therefore cannot be guessed without mocks
            };
          },
        },
      ],
      FIXME_tests: [
        "balance is sum of ops", // the balance depends on VTHO and it's earned without operations
        "empty transaction is equals to itself", //nonce is not deterministic
        "ref stability on self transaction", //blockref is not deterministic
        "can be run in parallel and all yield same results", //blockref is not deterministic
      ],
    },
    {
      raw: vechain3 as AccountRaw,
      transactions: [
        {
          name: "Not enough VTHO to pay fees",
          transaction: fromTransactionRaw({
            family: "vechain",
            estimatedFees: "210000000000000000",
            recipient: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
            amount: (1e18).toString(), // 1 VET
            body: {
              chainTag: MAINNET_CHAIN_TAG,
              blockRef: "0x00634a0c856ec1db",
              expiration: 18,
              clauses: [
                {
                  to: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                  value: (1e18).toString(),
                  data: "0x",
                },
              ],
              gas: "0",
              maxFeePerGas: 0,
              maxPriorityFeePerGas: 0,
              dependsOn: null,
              nonce: generateNonce(),
            },
          }),
          expectedStatus: (_account, _, status): Partial<TransactionStatusCommon> => {
            const estimatedFees = status.estimatedFees;
            return {
              amount: new BigNumber(1e18), // 1 VET
              estimatedFees, // fees are calculated during preparation and therefore cannot be guessed without mocks
              totalSpent: new BigNumber(1e18),
              errors: {
                amount: new NotEnoughVTHO(),
              },
              warnings: {},
            };
          },
        },
      ],
      FIXME_tests: [
        "balance is sum of ops", // the balance depends on VTHO and it's earned without operations
        "empty transaction is equals to itself", //nonce is not deterministic
        "ref stability on self transaction", //blockref is not deterministic
        "can be run in parallel and all yield same results", //blockref is not deterministic
      ],
    },
  ],
};

// describe("VeChain Bridge", () => {
//   test.todo("sample test");
// });

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js", "mock"],
  currencies: {
    vechain,
  },
};
