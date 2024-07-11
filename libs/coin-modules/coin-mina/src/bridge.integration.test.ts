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

const ACCOUNT_ADDRESS = "";
const ACCOUNT_ADDRESS_1 = "";

const mina: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "mina seed 1",
      apdus: `
      => 80040157148000002c8000018d800000008000000080000000
      <= 18d68decb70d4d4fd267d19a0d25edc06ad079e69ded41233a10976cf36391ec9000
      => 80040157148000002c8000018d800000008000000080000001
      <= 6cbf3b0f8d8b4667bf64bf44b4fefa830e4cef0e5da1e5cfb4015b5a755c4ac09000
      => 80040157148000002c8000018d800000008000000080000002
      <= 59dff1cf9185758c0c2f878c37a175280f3967dca8fee6e4ad0c4aa26daf8e5c9000
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
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: "novalidaddress",
            fees: new BigNumber(0).toString(),
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
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            fees: new BigNumber(0).toString(),
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
          name: "Invalid Memo",
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
          name: "Amount Required",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
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
          name: "Recipient same as source",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS,
            amount: "10",
            fees: new BigNumber(0).toString(),
          }),
          expectedStatus: {
            errors: {
              amount: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            amount: "1000",
            fees: new BigNumber(0).toString(),
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
