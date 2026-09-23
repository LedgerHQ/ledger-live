import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { Transaction, TransactionRaw } from "./types";

const currency = getCryptoCurrencyById("cosmos");
const account = { type: "Account", currency } as unknown as Account;

const baseTransaction: Transaction = {
  family: "cosmos",
  mode: "delegate",
  amount: new BigNumber(1000),
  recipient: "cosmos1recipient",
  fees: new BigNumber(500),
  gas: new BigNumber(80000),
  networkInfo: null,
  memo: null,
  validators: [],
  sourceValidator: null,
  useAllAmount: false,
} as unknown as Transaction;

describe("formatTransaction", () => {
  it("formats the legacy validators/sourceValidator shape", () => {
    const transaction: Transaction = {
      ...baseTransaction,
      mode: "redelegate",
      sourceValidator: "cosmosvaloper1source",
      validators: [{ address: "cosmosvaloper1dest", amount: new BigNumber(1000) }],
    };

    const formatted = formatTransaction(transaction, account);

    expect(formatted).toContain("0.001 -> cosmosvaloper1dest");
    expect(formatted).toContain("source validator=cosmosvaloper1source");
  });

  it("resolves validators/sourceValidator via valAddress/dstValAddress on redelegate", () => {
    const transaction: Transaction = {
      ...baseTransaction,
      mode: "redelegate",
      sourceValidator: null,
      validators: [],
      valAddress: "cosmosvaloper1source",
      dstValAddress: "cosmosvaloper1dest",
    };

    const formatted = formatTransaction(transaction, account);

    expect(formatted).toContain("0.001 -> cosmosvaloper1dest");
    expect(formatted).toContain("source validator=cosmosvaloper1source");
  });

  it("resolves a single validator via valAddress on delegate (no dstValAddress)", () => {
    const transaction: Transaction = {
      ...baseTransaction,
      mode: "delegate",
      validators: [],
      valAddress: "cosmosvaloper1single",
    };

    const formatted = formatTransaction(transaction, account);

    expect(formatted).toContain("0.001 -> cosmosvaloper1single");
    expect(formatted).not.toContain("source validator=");
  });

  it("omits the source validator line when there is none", () => {
    const transaction: Transaction = {
      ...baseTransaction,
      mode: "send",
      validators: [],
    };

    const formatted = formatTransaction(transaction, account);

    expect(formatted).not.toContain("source validator=");
  });
});

describe("fromTransactionRaw / toTransactionRaw — valAddress/dstValAddress", () => {
  const rawWithGenericFields: TransactionRaw = {
    family: "cosmos",
    mode: "redelegate",
    amount: "1000",
    recipient: "cosmos1recipient",
    fees: "500",
    gas: "80000",
    networkInfo: null,
    memo: null,
    validators: [],
    sourceValidator: null,
    useAllAmount: false,
    valAddress: "cosmosvaloper1source",
    dstValAddress: "cosmosvaloper1dest",
  } as unknown as TransactionRaw;

  it("carries valAddress and dstValAddress through fromTransactionRaw", () => {
    const transaction = fromTransactionRaw(rawWithGenericFields);

    expect(transaction.valAddress).toBe("cosmosvaloper1source");
    expect(transaction.dstValAddress).toBe("cosmosvaloper1dest");
  });

  it("omits valAddress/dstValAddress entirely when absent from the raw transaction", () => {
    const { valAddress, dstValAddress, ...rawWithoutGenericFields } = rawWithGenericFields;
    const transaction = fromTransactionRaw(rawWithoutGenericFields as TransactionRaw);

    expect("valAddress" in transaction).toBe(false);
    expect("dstValAddress" in transaction).toBe(false);
  });

  it("round-trips valAddress and dstValAddress through toTransactionRaw", () => {
    const transaction = fromTransactionRaw(rawWithGenericFields);
    const raw = toTransactionRaw(transaction);

    expect(raw.valAddress).toBe("cosmosvaloper1source");
    expect(raw.dstValAddress).toBe("cosmosvaloper1dest");
  });

  it("omits valAddress/dstValAddress from toTransactionRaw when absent on the transaction", () => {
    const transaction: Transaction = { ...baseTransaction, mode: "delegate" };
    const raw = toTransactionRaw(transaction);

    expect("valAddress" in raw).toBe(false);
    expect("dstValAddress" in raw).toBe(false);
  });
});
