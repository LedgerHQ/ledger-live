import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types";
import { createFixtureAccount } from "../types/bridge.fixture";
import { createTransaction } from "./createTransaction";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";

const RECIPIENT = "15oodc5d8DWJodZhTD6qsxxSQRYWhdkWCrwqNHajDirXRrAD";
const VALIDATOR = "13jAJfhpFkRZj1TSSdFopaiFeKnof2q7g4GNdcxcg8Lvx6QN";

const nominateTransaction: Transaction = {
  ...createTransaction(createFixtureAccount()),
  mode: "nominate",
  amount: new BigNumber(0),
  recipient: RECIPIENT,
  validators: [VALIDATOR],
  fees: new BigNumber(158612606),
  era: "1234",
  rewardDestination: "Stash",
  numSlashingSpans: 3,
};

const nominateRaw: TransactionRaw = {
  family: "polkadot",
  mode: "nominate",
  amount: "0",
  recipient: RECIPIENT,
  useAllAmount: false,
  validators: [VALIDATOR],
  fees: "158612606",
  era: "1234",
  rewardDestination: "Stash",
  numSlashingSpans: 3,
};

describe("polkadot transaction serialization", () => {
  it("serializes a transaction to its raw form", () => {
    expect(toTransactionRaw(nominateTransaction)).toEqual(nominateRaw);
  });

  it("deserializes a raw transaction", () => {
    expect(fromTransactionRaw(nominateRaw)).toEqual(nominateTransaction);
  });

  it("restores a serialized transaction", () => {
    expect(fromTransactionRaw(toTransactionRaw(nominateTransaction))).toEqual(nominateTransaction);
  });

  it("restores the default transaction", () => {
    const transaction = createTransaction(createFixtureAccount());

    expect(fromTransactionRaw(toTransactionRaw(transaction))).toEqual(transaction);
  });

  it("serializes the amounts as decimal strings", () => {
    const transaction: Transaction = {
      ...nominateTransaction,
      mode: "bond",
      amount: new BigNumber("2000000000000000000"),
    };

    expect(toTransactionRaw(transaction)).toEqual({
      ...nominateRaw,
      mode: "bond",
      amount: "2000000000000000000",
    });
  });

  it("serializes missing fees to null", () => {
    const transaction: Transaction = { ...nominateTransaction, fees: undefined };

    expect(toTransactionRaw(transaction).fees).toBeNull();
  });

  it("deserializes missing fees to null", () => {
    expect(fromTransactionRaw({ ...nominateRaw, fees: null }).fees).toBeNull();
  });

  it("keeps the use all amount flag", () => {
    const transaction: Transaction = { ...nominateTransaction, mode: "unbond", useAllAmount: true };

    expect(fromTransactionRaw(toTransactionRaw(transaction))).toEqual(transaction);
  });
});

describe("polkadot formatTransaction", () => {
  const account = createFixtureAccount();

  it("formats a send with its amount and recipient", () => {
    const transaction: Transaction = {
      ...nominateTransaction,
      mode: "send",
      amount: new BigNumber(10_000_000_000),
      validators: undefined,
    };

    expect(formatTransaction(transaction, account)).toEqual(`\nSEND  1 DOT\nTO ${RECIPIENT}`);
  });

  it("formats a send of the whole balance", () => {
    const transaction: Transaction = {
      ...nominateTransaction,
      mode: "send",
      useAllAmount: true,
      validators: undefined,
    };

    expect(formatTransaction(transaction, account)).toEqual(`
SEND MAX
TO ${RECIPIENT}`);
  });

  it("formats a nomination with its validator", () => {
    expect(formatTransaction(nominateTransaction, account)).toContain(VALIDATOR);
  });

  it("separates the validators of a nomination with a line break", () => {
    const transaction: Transaction = {
      ...nominateTransaction,
      validators: [VALIDATOR, RECIPIENT],
    };

    expect(formatTransaction(transaction, account)).toContain(`${VALIDATOR}\n${RECIPIENT}`);
  });

  it("omits the recipient when there is none", () => {
    const transaction: Transaction = {
      ...nominateTransaction,
      recipient: "",
      validators: undefined,
    };

    expect(formatTransaction(transaction, account)).toEqual("\nNOMINATE ");
  });
});
