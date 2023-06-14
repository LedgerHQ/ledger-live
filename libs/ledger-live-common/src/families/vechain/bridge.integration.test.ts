import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { AccountRaw, DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import { DEFAULT_GAS_COEFFICIENT, MAINNET_CHAIN_TAG } from "./constants";
import { vechain1 } from "./datasets/vechain";
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

const listSupported = listSupportedCurrencies();
listSupported.push(getCryptoCurrencyById("vechain"));
setSupportedCurrencies(listSupported.map(c => c.id) as CryptoCurrencyId[]);

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    vechain: {
      FIXME_ignoreAccountFields: ["balance", "spendableBalance", "estimateMaxSpendable"],
      scanAccounts: vechainScanAccounts1,
      accounts: [
        {
          raw: vechain1 as AccountRaw,
          implementations: ["js"],
          transactions: [
            {
              name: "Send VET",
              transaction: fromTransactionRaw({
                family: "vechain",
                estimatedFees: new BigNumber(0),
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: "1000000000000000000",
                body: {
                  chainTag: MAINNET_CHAIN_TAG,
                  blockRef: "0x00634a0c856ec1db",
                  expiration: 18,
                  clauses: [
                    {
                      to: "0x17733CAb76d9A2112576443F21735789733B1ca3",
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
                  "js:2:vechain:0x82d984c42fC9d49E2d4CFFdcad59301AfFca7E02:vechain+vechain%2Fvtho",
                estimatedFees: new BigNumber("210000000000000000"),
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
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
                        "0x17733CAb76d9A2112576443F21735789733B1ca3",
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
                estimatedFees: new BigNumber("665180000000000000"),
                totalSpent: new BigNumber("1665180000000000000"),
                errors: {},
                warnings: {},
              },
            },
            {
              name: "Amount required",
              transaction: fromTransactionRaw({
                family: "vechain",
                estimatedFees: new BigNumber(0),
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
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
                estimatedFees: new BigNumber(0),
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: "20000000000000000000",
                body: {
                  chainTag: MAINNET_CHAIN_TAG,
                  blockRef: "0x00634a0c856ec1db",
                  expiration: 18,
                  clauses: [
                    {
                      to: "0x17733CAb76d9A2112576443F21735789733B1ca3",
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
                totalSpent: new BigNumber("0"),
                estimatedFees: new BigNumber("0"),
              },
            },
            {
              name: "VTHO balance not enough",
              transaction: fromTransactionRaw({
                family: "vechain",
                subAccountId:
                  "js:2:vechain:0x82d984c42fC9d49E2d4CFFdcad59301AfFca7E02:vechain+vechain%2Fvtho",
                estimatedFees: new BigNumber(0),
                recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
                amount: "20000000000000000000",
                body: {
                  chainTag: MAINNET_CHAIN_TAG,
                  blockRef: "0x00634a0c856ec1db",
                  expiration: 18,
                  clauses: [
                    {
                      to: "0x17733CAb76d9A2112576443F21735789733B1ca3",
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
                totalSpent: new BigNumber("0"),
                estimatedFees: new BigNumber("0"),
              },
            },
          ],
          FIXME_tests: [
            "balance is sum of ops", //the balance depends on VTHO and it's earned without operations
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
