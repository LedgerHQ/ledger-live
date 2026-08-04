import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
} from "@ledgerhq/ledger-wallet-framework/errors";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getEstimatedFees } from "../bridge/bridgeHelpers/fee";
import { fromTransactionRaw } from "../bridge/transaction";
import { InvalidMemoICP } from "../errors";
import type { Transaction } from "../types";

const SEED_IDENTIFIER =
  "046f08828871028b6e3cb5c13b2e2a8fa6e93f0b3ca7379171f6b7b45877955a2430925f76ec69ccb3cd8738859a8e29dcd0f9a357f1d009d2b497c6c8f63aa7cf";

// const SEED_IDENTIFIER_ADDRESS = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const ACCOUNT_2 = "fdb7db0d3ae67368cb5010b7de7d98566c072f0a4eda871f45cd6582bf08aeb4";

const internet_computer: CurrenciesData<Transaction> = {
  // DMK-only signer requires a DMK transport, which the plain APDU-replay harness
  // cannot provide; account discovery is covered on-device and in the signer-kit tests.
  scanAccounts: [],
  accounts: [
    {
      raw: {
        id: `js:2:internet_computer:${SEED_IDENTIFIER}:`,
        balance: "1000000",
        currencyId: "internet_computer",
        derivationMode: "internet_computer",
        freshAddress: "",
        freshAddressPath: "44'/223'/0'/0/0",
        index: 0,
        name: "Internet Computer 1",
        operationsCount: 1,
        blockHeight: 0,
        pendingOperations: [],
        operations: [],
        lastSyncDate: "",
        seedIdentifier: SEED_IDENTIFIER,
        spendableBalance: "1000000",
        swapHistory: [],
        syncHash: undefined,
        used: true,
        xpub: SEED_IDENTIFIER,
      },
      transactions: [
        {
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: "novalidaddress",
            fees: getEstimatedFees().toString(),
            amount: "1000",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: ACCOUNT_2,
            fees: getEstimatedFees().toString(),
            amount: (300 * 1e9).toString(),
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Invalid transferID/Memo",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: ACCOUNT_2,
            fees: getEstimatedFees().toString(),
            amount: "1000",
            memo: "-1",
          }),
          expectedStatus: {
            errors: {
              transaction: new InvalidMemoICP(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount Required",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: ACCOUNT_2,
            amount: "0",
            fees: getEstimatedFees().toString(),
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: ACCOUNT_2,
            amount: "1000",
            fees: getEstimatedFees().toString(),
          }),
          expectedStatus: {
            amount: new BigNumber("1000"),
            errors: {},
            warnings: {},
          },
        },
      ],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    internet_computer,
  },
};
