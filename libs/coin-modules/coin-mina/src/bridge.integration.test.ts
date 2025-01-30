import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import { InvalidMemoMina } from "./errors";

const ACCOUNT_ADDRESS = "B62qkdFWJSW8zaTBZjTVtmeU3rVxyUkNxPhKKW8T2JBtpj5XfdywLSM";
const ACCOUNT_ADDRESS_1 = "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314";

const mina: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "mina seed 1",
      apdus: `
      => e00200000400000000
      <= 423632716b6446574a5357387a6154425a6a5456746d65553372567879556b4e7850684b4b573854324a4274706a3558666479774c534d009000
      => e00200000400000001
      <= 423632716b576348686f6973574443523776336776577a5836775845567547594c485871336d53796d3447457a6659586d534476333134009000
      => e00200000400000002
      <= 423632716d6233356642476a50714c75456f4842336242766f3834397a32707738423271335854703677765a4d4c734641336562325647009000
      `,
    },
  ],
  accounts: [
    {
      // Skipping due to rewards being auto-compounded, no operation as evidence
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:mina:${ACCOUNT_ADDRESS}:`,
        seedIdentifier: `${ACCOUNT_ADDRESS}`,
        name: "MINA 1",
        derivationMode: "minabip44h",
        index: 0,
        freshAddress: `${ACCOUNT_ADDRESS}`,
        freshAddressPath: "44'/12586'/0'/0'/0'",
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "mina",
        lastSyncDate: "",
        balance: "1000000",
      },
      transactions: [
        {
          name: "not a valid address",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: "novalidaddress",
            fees: new BigNumber(0).toString(),
            amount: "1000",
            memo: undefined,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "not enough balance",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            fees: new BigNumber(0).toString(),
            amount: (300 * 1e9).toString(),
            memo: undefined,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "invalid Memo",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            fees: new BigNumber(0).toString(),
            amount: "1000",
            memo: "string greated than 32 chars is invalid",
          }),
          expectedStatus: {
            errors: {
              transaction: new InvalidMemoMina(),
            },
            warnings: {},
          },
        },
        {
          name: "amount Required",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            memo: undefined,
            amount: "0",
            fees: new BigNumber(0).toString(),
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "recipient same as source",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS,
            amount: "10",
            fees: new BigNumber(0).toString(),
            memo: undefined,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "new account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            amount: "1000",
            fees: new BigNumber(0).toString(),
            memo: undefined,
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
    mina,
  },
};

describe("Mina bridge", () => {
  test.todo(
    "This is an empty test to make jest command pass. Remove it once there is a real test.",
  );
});
