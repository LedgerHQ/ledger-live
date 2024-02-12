import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { AccountRaw, DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import { DEFAULT_GAS_COEFFICIENT, MAINNET_CHAIN_TAG } from "./constants";
import { vechain1, vechain3 } from "./datasets/vechain";
import { generateNonce } from "./utils/transaction-utils";
import BigNumber from "bignumber.js";
import {
  setSupportedCurrencies,
  listSupportedCurrencies,
  getCryptoCurrencyById,
} from "../../currencies";
import vechainScanAccounts1 from "./datasets/vechain.scanAccounts.1";
import { AmountRequired, NotEnoughBalance } from "@ledgerhq/errors";
import VIP180 from "./contracts/abis/VIP180";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { NotEnoughVTHO } from "./errors";

const listSupported = listSupportedCurrencies();
listSupported.push(getCryptoCurrencyById("vechain"));
setSupportedCurrencies(listSupported.map(c => c.id) as CryptoCurrencyId[]);

const dataset: DatasetTest<Transaction> = {
  implementations: ["js", "mock"],
  currencies: {
    vechain: {
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
                amount: "1000000000000000000",
                body: {
                  chainTag: MAINNET_CHAIN_TAG,
                  blockRef: "0x00634a0c856ec1db",
                  expiration: 18,
                  clauses: [
                    {
                      to: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                      value: "1000000000000000000",
                      data: "0x",
                    },
                  ],
                  gasPriceCoef: DEFAULT_GAS_COEFFICIENT,
                  gas: "0",
                  dependsOn: null,
                  nonce: generateNonce(),
                },
              }),
              expectedStatus: {
                amount: new BigNumber("1000000000000000000"),
                estimatedFees: new BigNumber("210000000000000000"),
                totalSpent: new BigNumber("1000000000000000000"),
                errors: {},
                warnings: {},
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
                amount: "1000000000000000000",
                body: {
                  chainTag: MAINNET_CHAIN_TAG,
                  blockRef: "0x00634a0c856ec1db",
                  expiration: 18,
                  clauses: [
                    {
                      to: "0x0000000000000000000000000000456e65726779",
                      value: 0,
                      data: VIP180.transfer.encode(
                        "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                        "9000000000000000000",
                      ),
                    },
                  ],
                  gasPriceCoef: DEFAULT_GAS_COEFFICIENT,
                  gas: "0",
                  dependsOn: null,
                  nonce: generateNonce(),
                },
              }),
              expectedStatus: {
                amount: new BigNumber("1000000000000000000"),
                estimatedFees: new BigNumber("515180000000000000"),
                totalSpent: new BigNumber("1515180000000000000"),
                errors: {},
                warnings: {},
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
                  gasPriceCoef: DEFAULT_GAS_COEFFICIENT,
                  gas: "0",
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
                amount: "20000000000000000000",
                body: {
                  chainTag: MAINNET_CHAIN_TAG,
                  blockRef: "0x00634a0c856ec1db",
                  expiration: 18,
                  clauses: [
                    {
                      to: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                      value: "20000000000000000000",
                      data: "0x",
                    },
                  ],
                  gasPriceCoef: DEFAULT_GAS_COEFFICIENT,
                  gas: "0",
                  dependsOn: null,
                  nonce: generateNonce(),
                },
              }),
              expectedStatus: {
                amount: new BigNumber("20000000000000000000"),
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
                totalSpent: new BigNumber("20000000000000000000"),
                estimatedFees: new BigNumber("210000000000000000"),
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
                amount: "20000000000000000000",
                body: {
                  chainTag: MAINNET_CHAIN_TAG,
                  blockRef: "0x00634a0c856ec1db",
                  expiration: 18,
                  clauses: [
                    {
                      to: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                      value: "20000000000000000000",
                      data: "0x",
                    },
                  ],
                  gasPriceCoef: DEFAULT_GAS_COEFFICIENT,
                  gas: "0",
                  dependsOn: null,
                  nonce: generateNonce(),
                },
              }),
              expectedStatus: {
                amount: new BigNumber("20000000000000000000"),
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
                totalSpent: new BigNumber("20515820000000000000"),
                estimatedFees: new BigNumber("515820000000000000"),
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
                amount: "1000000000000000000",
                body: {
                  chainTag: MAINNET_CHAIN_TAG,
                  blockRef: "0x00634a0c856ec1db",
                  expiration: 18,
                  clauses: [
                    {
                      to: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
                      value: "1000000000000000000",
                      data: "0x",
                    },
                  ],
                  gasPriceCoef: DEFAULT_GAS_COEFFICIENT,
                  gas: "0",
                  dependsOn: null,
                  nonce: generateNonce(),
                },
              }),
              expectedStatus: {
                amount: new BigNumber("1000000000000000000"),
                estimatedFees: new BigNumber("210000000000000000"),
                totalSpent: new BigNumber("1000000000000000000"),
                errors: {
                  amount: new NotEnoughVTHO(),
                },
                warnings: {},
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
    },
  },
};

testBridge(dataset);
