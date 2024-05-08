import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { getAccountBridge } from "../../bridge";
import { decodeAccountId, encodeAccountId, fromAccountRaw } from "../../account";
import { BigNumber } from "bignumber.js";
import { AmountRequired, InvalidAddress, NotEnoughBalance } from "@ledgerhq/errors";

import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "../filecoin/transaction";

const SEED_IDENTIFIER = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";
const ACCOUNT_1 = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";
const ACCOUNT_2 = "f410fncojwmrseefktoco6rcnb3zv2eiqfli7muhvqma";
const ACCOUNT_3 = "0x689c9b3232210aa9b84ef444d0ef35d11102ad1f";
const ACCOUNT_4 = "f01840380";

const filecoin: CurrenciesData<Transaction> = {
  scanAccounts: [],
  accounts: [
    {
      raw: {
        id: `js:2:filecoin:${SEED_IDENTIFIER}:glif`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "Filecoin 1",
        derivationMode: "" as const,
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/461'/0'/0/0",
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "filecoin",
        lastSyncDate: "",
        balance: "1000",
      },
      transactions: [
        {
          name: "Not a valid address (fil)",
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
          name: "Not a valid address (eth)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 100,
            gasPremium: "200",
            recipient: "0x689c9b3232210tt9b84ef444d0ef35d11102adjj",
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
            amount: "100000000000000000000",
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
            gasFeeCap: "10",
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
          name: "New account and sufficient amount (f1)",
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
        {
          name: "New account and sufficient amount (f0)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_4,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (0x eth)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_3,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f4)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_2,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "Send max",
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
            useAllAmount: true,
          }),
          expectedStatus: (account, tx, status) => {
            return {
              amount: account.spendableBalance.minus(status.estimatedFees),
              errors: {},
              warnings: {},
            };
          },
        },
      ],
    },
  ],
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    filecoin,
  },
};

testBridge(dataset);

describe("estimateMaxSpendable", () => {
  test("it should failed on invalid recipient", async () => {
    const accounts = dataset.currencies["filecoin"].accounts || [];
    const accountData = accounts[0];

    const account = fromAccountRaw({
      ...accountData.raw,
      id: encodeAccountId({
        ...decodeAccountId(accountData.raw.id),
        type: dataset.implementations[0],
      }),
    });

    const accountBridge = getAccountBridge(account);
    const estimate = async () => {
      await accountBridge.estimateMaxSpendable({
        account,
        transaction: { recipient: "notavalidrecipient" },
      });
    };

    await expect(estimate).rejects.toThrowError(new InvalidAddress());
  });
});
