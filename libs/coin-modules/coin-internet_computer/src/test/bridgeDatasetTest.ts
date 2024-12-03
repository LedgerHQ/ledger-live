import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "../bridge/transaction";
import BigNumber from "bignumber.js";
import { AmountRequired, InvalidAddress, NotEnoughBalance } from "@ledgerhq/errors";
import { getEstimatedFees } from "../bridge/bridgeHelpers/fee";
import { InvalidMemoICP } from "../errors";

const SEED_IDENTIFIER =
  "046f08828871028b6e3cb5c13b2e2a8fa6e93f0b3ca7379171f6b7b45877955a2430925f76ec69ccb3cd8738859a8e29dcd0f9a357f1d009d2b497c6c8f63aa7cf";

// const SEED_IDENTIFIER_ADDRESS = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const ACCOUNT_2 = "fdb7db0d3ae67368cb5010b7de7d98566c072f0a4eda871f45cd6582bf08aeb4";

const internet_computer: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "internet_computer seed 1",
      apdus: `
      => 11010000142c000080df000080000000800000000000000000
      <= 046f08828871028b6e3cb5c13b2e2a8fa6e93f0b3ca7379171f6b7b45877955a2430925f76ec69ccb3cd8738859a8e29dcd0f9a357f1d009d2b497c6c8f63aa7cf182d2af0e048c8cf215fa86d7af7e2234f401679c7839dd3b1ae916a02e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37793471646770797966757670627963697a646873637835696e763570707972646a3561626d366f68716f6f35686d6e6f73667661659000
      => 11010000142c000080df000080000000800000000001000000
      <= 043ad9dda46b25cbcf98b2d91f8aa289d08078fa960d13e7d77a571c625eedcb62b6c26a86408d30a6bbdea5ecad6f7603bc1ba11fbb62caa315789f333ece2c8cd785035623de419beb00247d11fbb4d3f77fbb466869fb01deac4f61021723b9a25b7cb1865caa6e633fc727c95cee6a84c52e5ca0f8752ecf66cdea4b6764756f79346f78717562766d69363669676e367761626570756937786e677436353733777274696e6835716478766d6a357171659000
      `,
      test: (expect, accounts) => {
        for (const account of accounts) {
          expect(account.derivationMode).toEqual("internet_computer");
        }
      },
    },
  ],
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
