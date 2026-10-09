import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { Transaction, TransactionRaw } from "./types";

const SOURCE = "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2";
const DESTINATION = "cosmosvaloper1n229vhepft6wnkt5tjpwmxdmcnfz55jv3vp77d";

const baseRaw = {
  family: "cosmos",
  mode: "send",
  networkInfo: {
    family: "cosmos",
    fees: "0.123456",
  },
  fees: "0.123456",
  gas: "7890",
  memo: "test memo",
  amount: new BigNumber("1000000"),
  recipient: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
  recipientDomain: {
    registry: "ens",
    domain: ".cosmos",
    address: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5",
    type: "forward",
  },
} as unknown as TransactionRaw;

const baseTransaction = {
  family: "cosmos",
  mode: "send",
  networkInfo: {
    family: "cosmos",
    fees: new BigNumber("0.123456"),
  },
  fees: new BigNumber("0.123456"),
  gas: new BigNumber("7890"),
  memo: "test memo",
  memoType: "text",
  memoValue: "test memo",
  amount: new BigNumber("1000000"),
  recipient: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
  recipientDomain: {
    registry: "ens",
    domain: ".cosmos",
    address: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5",
    type: "forward",
  },
} as unknown as Transaction;

const currency = getCryptoCurrencyById("cosmos");
const account = { type: "Account", currency } as unknown as Account;

describe("fromTransactionRaw", () => {
  it("should convert a send transaction without validator fields", () => {
    const result = fromTransactionRaw(baseRaw);
    expect(result).toEqual({
      family: "cosmos",
      mode: "send",
      networkInfo: {
        family: "cosmos",
        fees: new BigNumber("0.123456"),
      },
      fees: new BigNumber("0.123456"),
      gas: new BigNumber("7890"),
      memo: "test memo",
      memoType: "text",
      memoValue: "test memo",
      amount: new BigNumber("1000000"),
      recipient: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
      recipientDomain: {
        registry: "ens",
        domain: ".cosmos",
        address: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5",
        type: "forward",
      },
    });
  });

  it("ignores validator fields on a send transaction", () => {
    const result = fromTransactionRaw({ ...baseRaw, valAddress: SOURCE, sourceValidator: SOURCE });
    expect(result).not.toHaveProperty("valAddress");
    expect(result).not.toHaveProperty("dstValAddress");
    expect(result).not.toHaveProperty("validators");
    expect(result).not.toHaveProperty("sourceValidator");
  });

  it("keeps valAddress on a staking transaction", () => {
    const result = fromTransactionRaw({ ...baseRaw, mode: "delegate", valAddress: SOURCE });
    expect(result).toMatchObject({ mode: "delegate", valAddress: SOURCE });
    expect(result).not.toHaveProperty("dstValAddress");
  });

  it("keeps valAddress and dstValAddress on a redelegate transaction", () => {
    const result = fromTransactionRaw({
      ...baseRaw,
      mode: "redelegate",
      valAddress: SOURCE,
      dstValAddress: DESTINATION,
    });
    expect(result).toMatchObject({
      mode: "redelegate",
      valAddress: SOURCE,
      dstValAddress: DESTINATION,
    });
  });

  it("migrates the legacy validators of a staking transaction to valAddress", () => {
    const result = fromTransactionRaw({
      ...baseRaw,
      mode: "undelegate",
      validators: [{ address: SOURCE, amount: "12345.6789" }],
    });
    expect(result).toMatchObject({ mode: "undelegate", valAddress: SOURCE });
    expect(result).not.toHaveProperty("validators");
  });

  it("falls back to an empty valAddress when a legacy staking transaction has no validator", () => {
    expect(fromTransactionRaw({ ...baseRaw, mode: "delegate" })).toMatchObject({ valAddress: "" });
    expect(
      fromTransactionRaw({ ...baseRaw, mode: "delegate", validators: [] } as TransactionRaw),
    ).toMatchObject({ valAddress: "" });
  });

  it("migrates the legacy sourceValidator and validators of a redelegate transaction", () => {
    const result = fromTransactionRaw({
      ...baseRaw,
      mode: "redelegate",
      sourceValidator: SOURCE,
      validators: [{ address: DESTINATION, amount: "1" }],
    });
    expect(result).toMatchObject({
      mode: "redelegate",
      valAddress: SOURCE,
      dstValAddress: DESTINATION,
    });
    expect(result).not.toHaveProperty("sourceValidator");
    expect(result).not.toHaveProperty("validators");
  });

  it("falls back to empty addresses when a legacy redelegate transaction has none", () => {
    expect(fromTransactionRaw({ ...baseRaw, mode: "redelegate" })).toMatchObject({
      valAddress: "",
      dstValAddress: "",
    });
    expect(
      fromTransactionRaw({ ...baseRaw, mode: "redelegate", validators: [] } as TransactionRaw),
    ).toMatchObject({ dstValAddress: "" });
  });

  it("carries memoType and memoValue over when present", () => {
    const result = fromTransactionRaw({ ...baseRaw, memoType: "text", memoValue: "test memo" });
    expect(result.memoType).toEqual("text");
    expect(result.memoValue).toEqual("test memo");
  });

  it("omits memoType and memoValue when absent", () => {
    const result = fromTransactionRaw({ ...baseRaw, memo: undefined });
    expect(result).not.toHaveProperty("memoType");
    expect(result).not.toHaveProperty("memoValue");
  });

  it("should put legacy memo into memoValue", () => {
    const result = fromTransactionRaw(baseRaw);
    expect(result.memoType).toEqual("text");
    expect(result.memoValue).toEqual("test memo");
  });

  it("falls back to the legacy memo when memoValue and memoType are null", () => {
    const result = fromTransactionRaw({
      ...baseRaw,
      memo: "legacy",
      memoValue: null,
      memoType: null,
    } as unknown as TransactionRaw);
    expect(result.memoValue).toEqual("legacy");
    expect(result.memoType).toEqual("text");
  });

  it("keeps null memoValue and memoType as null, like the generic createTransaction makes them", () => {
    const result = fromTransactionRaw({
      ...baseRaw,
      memo: null,
      memoValue: null,
      memoType: null,
    } as unknown as TransactionRaw);
    expect(result.memoType).toBeNull();
    expect(result.memoValue).toBeNull();
  });

  it("adds no memoType or memoValue when an old raw transaction only has a null memo", () => {
    const result = fromTransactionRaw({ ...baseRaw, memo: null } as unknown as TransactionRaw);
    expect(result).not.toHaveProperty("memoType");
    expect(result).not.toHaveProperty("memoValue");
  });

  it("handles a minimal raw transaction", () => {
    const result = fromTransactionRaw({
      ...baseRaw,
      networkInfo: undefined,
      fees: null,
      gas: null,
    } as unknown as TransactionRaw);
    expect(result.networkInfo).toBeUndefined();
    expect(result.fees).toBeNull();
    expect(result.gas).toBeNull();
  });
});

describe("toTransactionRaw", () => {
  it("should convert a send transaction into a raw without validator fields", () => {
    const result = toTransactionRaw(baseTransaction);
    expect(result).toEqual({
      family: "cosmos",
      mode: "send",
      networkInfo: {
        family: "cosmos",
        fees: "0.123456",
      },
      fees: "0.123456",
      gas: "7890",
      memo: "test memo",
      memoType: "text",
      memoValue: "test memo",
      amount: "1000000",
      recipient: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
      recipientDomain: {
        registry: "ens",
        domain: ".cosmos",
        address: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5",
        type: "forward",
      },
    });
  });

  it("writes only valAddress for a staking transaction", () => {
    const result = toTransactionRaw({ ...baseTransaction, mode: "delegate", valAddress: SOURCE });
    expect(result.valAddress).toBe(SOURCE);
    expect(result).not.toHaveProperty("dstValAddress");
    expect(result).not.toHaveProperty("validators");
    expect(result).not.toHaveProperty("sourceValidator");
  });

  it("writes valAddress and dstValAddress for a redelegate transaction", () => {
    const result = toTransactionRaw({
      ...baseTransaction,
      mode: "redelegate",
      valAddress: SOURCE,
      dstValAddress: DESTINATION,
    });
    expect(result.valAddress).toBe(SOURCE);
    expect(result.dstValAddress).toBe(DESTINATION);
    expect(result).not.toHaveProperty("validators");
    expect(result).not.toHaveProperty("sourceValidator");
  });

  it("carries memoType and memoValue over when present", () => {
    const result = toTransactionRaw({
      ...baseTransaction,
      memoType: "text",
      memoValue: "test memo",
    });
    expect(result.memoType).toBe("text");
    expect(result.memoValue).toBe("test memo");
  });

  it("omits memoType and memoValue when absent", () => {
    const transaction = { ...baseTransaction };
    delete transaction.memoType;
    delete transaction.memoValue;

    const result = toTransactionRaw(transaction);
    expect(result).not.toHaveProperty("memoType");
    expect(result).not.toHaveProperty("memoValue");
  });

  it("handles a minimal transaction", () => {
    const result = toTransactionRaw({
      ...baseTransaction,
      networkInfo: undefined,
      fees: null,
      gas: null,
    } as unknown as Transaction);
    expect(result.networkInfo).toBeUndefined();
    expect(result.fees).toBeNull();
    expect(result.gas).toBeNull();
  });
});

describe("formatTransaction", () => {
  it("prints MAX when useAllAmount is set", () => {
    const formatted = formatTransaction({ ...baseTransaction, useAllAmount: true }, account);
    expect(formatted).toContain("SEND MAX");
  });

  it("prints no amount when the amount is zero", () => {
    const formatted = formatTransaction({ ...baseTransaction, amount: new BigNumber(0) }, account);
    expect(formatted).toMatch(/^\nSEND \nTO /);
  });

  it("prints ? when fees are unknown and omits an empty memo", () => {
    const formatted = formatTransaction(
      { ...baseTransaction, fees: null, memo: undefined },
      account,
    );
    expect(formatted).toContain("with fees=?");
    expect(formatted).not.toContain("memo=");
  });

  it("prints the destination and source validators on redelegate", () => {
    const transaction: Transaction = {
      ...baseTransaction,
      mode: "redelegate",
      valAddress: SOURCE,
      dstValAddress: DESTINATION,
    };

    const formatted = formatTransaction(transaction, account);

    expect(formatted).toContain(`1 -> ${DESTINATION}`);
    expect(formatted).toContain(`source validator=${SOURCE}`);
  });

  it("prints a single validator on delegate", () => {
    const transaction: Transaction = {
      ...baseTransaction,
      mode: "delegate",
      valAddress: "cosmosvaloper1single",
    };

    const formatted = formatTransaction(transaction, account);

    expect(formatted).toContain("1 -> cosmosvaloper1single");
    expect(formatted).not.toContain("source validator=");
  });

  it("prints no validator on send", () => {
    const formatted = formatTransaction(baseTransaction, account);

    expect(formatted).toMatch(/SEND\s+1\s+ATOM/);
    expect(formatted).toContain(
      "TO cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
    );
    expect(formatted).not.toContain("->");
    expect(formatted).not.toContain("source validator=");
    expect(formatted).toContain("with fees=0");
    expect(formatted).toContain("memo=test memo");
  });
});

describe("transaction raw round trip", () => {
  const roundTrip = (t: Transaction) => fromTransactionRaw(toTransactionRaw(t));

  // What the generic `createTransaction` gives for cosmos: no `gas`, no `memo`, null memo fields.
  const genericEmpty = {
    family: "cosmos",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    fees: null,
    useAllAmount: false,
    memoType: null,
    memoValue: null,
    networkInfo: null,
  } as unknown as Transaction;

  // What the legacy `createTransaction` gives.
  const legacyEmpty = {
    family: "cosmos",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    fees: null,
    gas: null,
    useAllAmount: false,
    networkInfo: null,
    memo: null,
  } as unknown as Transaction;

  it("gives back an empty transaction made by the generic bridge", () => {
    expect(roundTrip(genericEmpty)).toEqual(genericEmpty);
  });

  it("keeps the null memo fields of the generic transaction as null", () => {
    const result = roundTrip(genericEmpty);

    expect(result.memoType).toBeNull();
    expect(result.memoValue).toBeNull();
    expect(result.gas).toBeUndefined();
  });

  it("gives back an empty transaction made by the legacy bridge", () => {
    expect(roundTrip(legacyEmpty)).toEqual(legacyEmpty);
  });

  it("gives back a transaction with a memo, a gas value and fees", () => {
    const transaction = {
      ...genericEmpty,
      amount: new BigNumber(1000),
      recipient: "cosmos1recipient",
      fees: new BigNumber(500),
      gas: new BigNumber(200000),
      memoType: "text",
      memoValue: "invoice 42",
    } as unknown as Transaction;

    expect(roundTrip(transaction)).toEqual(transaction);
  });

  it("gives back a staking transaction", () => {
    const transaction = {
      ...genericEmpty,
      mode: "redelegate",
      valAddress: SOURCE,
      dstValAddress: DESTINATION,
    } as unknown as Transaction;

    expect(roundTrip(transaction)).toEqual(transaction);
  });

  it("still reads a raw transaction that only has the old memo field", () => {
    const raw = { ...baseRaw, memo: "old memo" } as TransactionRaw;
    const result = fromTransactionRaw(raw);

    expect(result.memoType).toBe("text");
    expect(result.memoValue).toBe("old memo");
  });
});
