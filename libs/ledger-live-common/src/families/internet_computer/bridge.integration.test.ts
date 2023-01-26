import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import BigNumber from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import { getEstimatedFees } from "./utils";

const SEED_IDENTIFIER =
  "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const ACCOUNT_2 =
  "fdb7db0d3ae67368cb5010b7de7d98566c072f0a4eda871f45cd6582bf08aeb4";

const internet_computer: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "internet_computer seed 1",
      apdus: `
      => 11010000142c000080df000080000000800000000000000000
      <= 046f08828871028b6e3cb5c13b2e2a8fa6e93f0b3ca7379171f6b7b45877955a2430925f76ec69ccb3cd8738859a8e29dcd0f9a357f1d009d2b497c6c8f63aa7cf182d2af0e048c8cf215fa86d7af7e2234f401679c7839dd3b1ae916a02e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37793471646770797966757670627963697a646873637835696e763570707972646a3561626d366f68716f6f35686d6e6f73667661659000
      => 11010000142c000080df000080010000800000000000000000
      <= 04fc89df2bb2677347117b550c9a66b9a54c384dfee78a83a1e3010fd2f5ce7418f6706102bc5611094702f64773fd5569ca5e24c44b77383e58e034f521f96bafe7b69dcf5141bfb119194185a296a11aa33c986f48369fac7ec6571b0202c1bf9b7b539ad8e39cf4df4881742be4fa2c4a6b1b97c1b735972665556742706e756a7566786877326f3436756b627836797273676b627177726a6e696932756d366a7133326967327032793777676b346e71659000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:icp:${SEED_IDENTIFIER}:internet_computer`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "",
        derivationMode: "internet_computer" as const,
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/223'/0'/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "internet_computer",
        unitMagnitude: 8,
        lastSyncDate: "",
        balance: "1000",
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

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    internet_computer,
  },
};

testBridge(dataset);
