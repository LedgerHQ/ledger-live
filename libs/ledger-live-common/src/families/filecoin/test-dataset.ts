import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
} from "@ledgerhq/errors";

import type { DatasetTest } from "../../types";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "../filecoin/transaction";

const SEED_IDENTIFIER = "f1zx43cf6qb6rd5e4okl7lexnjumxe5toqj6vtr3i";
const ACCOUNT_1 = "t1d2xrzcslx7xlbbylc5c3d5lvandqw4iwl6epxba";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const filecoin = {
  FIXME_ignoreAccountFields: [],
  scanAccounts: [
    {
      name: "filecoin seed 1",
      apdus: `
      => 0600000000
      <= 0000120500311000049000
      => 06010000142c000080cd010080000000800000000000000000
      <= 041e10b3a453db1e7324cd37e78820d7d150c13ba3bf784be204c91afe495816a19a836e85cb89b0e4ff36d06a71a9ca02947de79e16e66dacc645e46dcdf7d9091501cdf9b117d00fa23e938e52feb25da9a32e4ecdd02966317a78343363663671623672643565346f6b6c376c65786e6a756d786535746f716a3676747233699000
      => 0600000000
      <= 0000120500311000049000
      => 06010000142c000080cd010080000000800000000001000000
      <= 04b481eeff158ba0044fa075b2a53cb34de11193699e0fd0ee8abb10fa2acd9bc32147af05001b01bf6341c9e78b7a8244d0d3fd2a424e361dab346de6aeee251515018003fd987489d8855f1f4486d85db219497bb346296631716162373367647572686d696b7879376973646e71786e7364666578786d32676f6d34376f70699000
      => 0600000000
      <= 0000120500311000049000
      => 06010000142c000080cd010080010000800000000000000000
      <= 047ad655911df4ff9307af1ecdb6aea774530aae68db5247e0ca62681ad8be304595b847825670f031d553add8151e3b46eb60f85627a4d85d3dd96cf1e5fc5ba21501b3c284b3a95a29e023a86bcb6184eebcaf6ed4a4296631777062696a6d356a6c697536616935696e7066776462686f7873787735766665677364366c79719000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:filecoin:${SEED_IDENTIFIER}:filecoin`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "Filecoin 1",
        derivationMode: "filecoin",
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/461'/0'/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "filecoin",
        unitMagnitude: 18,
        lastSyncDate: "",
        balance: "1000",
      },
      transactions: [
        {
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 100,
            gasPremium: "200",
            recipient: "novalidaddress",
            amount: "100000000",
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
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "100000000000000000000000000",
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
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "0",
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
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
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
    // FIXME please enable again when test pass again
    // filecoin,
  },
};
export default dataset;
