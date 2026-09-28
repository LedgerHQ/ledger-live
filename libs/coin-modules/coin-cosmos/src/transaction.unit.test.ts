import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { Transaction, TransactionRaw } from "./types";

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
  sourceValidator: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
  validators: [
    {
      address: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
      amount: "12345.67890",
    },
  ],
  amount: new BigNumber("1000000"),
  recipient: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
  recipientDomain: {
    registry: "ens",
    domain: ".cosmos",
    address: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5",
    type: "forward",
  },
  valAddress: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
  dstValAddress: "cosmosvaloper1n229vhepft6wnkt5tjpwmxdmcnfz55jv3vp77d",
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
  sourceValidator: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
  validators: [
    {
      address: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
      amount: "12345.67890",
    },
  ],
  amount: new BigNumber("1000000"),
  recipient: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
  recipientDomain: {
    registry: "ens",
    domain: ".cosmos",
    address: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5",
    type: "forward",
  },
  valAddress: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
  dstValAddress: "cosmosvaloper1n229vhepft6wnkt5tjpwmxdmcnfz55jv3vp77d",
} as unknown as Transaction;

const currency = getCryptoCurrencyById("cosmos");
const account = { type: "Account", currency } as unknown as Account;

describe("fromTransactionRaw", () => {
  it("should convert into a transaction", () => {
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
      sourceValidator: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
      validators: [
        {
          address: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
          amount: new BigNumber("12345.67890"),
        },
      ],
      amount: new BigNumber("1000000"),
      recipient: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
      recipientDomain: {
        registry: "ens",
        domain: ".cosmos",
        address: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5",
        type: "forward",
      },
      valAddress: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
      dstValAddress: "cosmosvaloper1n229vhepft6wnkt5tjpwmxdmcnfz55jv3vp77d",
    });
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

  it("omits memo fields when memo, memoValue and memoType are all null", () => {
    const result = fromTransactionRaw({
      ...baseRaw,
      memo: null,
      memoValue: null,
      memoType: null,
    } as unknown as TransactionRaw);
    expect(result).not.toHaveProperty("memoType");
    expect(result).not.toHaveProperty("memoValue");
  });

  it("handles a minimal raw transaction", () => {
    const result = fromTransactionRaw({
      ...baseRaw,
      networkInfo: undefined,
      fees: null,
      gas: null,
      validators: undefined,
      valAddress: undefined,
      dstValAddress: undefined,
    } as unknown as TransactionRaw);
    expect(result.networkInfo).toBeUndefined();
    expect(result.fees).toBeNull();
    expect(result.gas).toBeNull();
    expect(result.validators).toEqual([]);
    expect(result).not.toHaveProperty("valAddress");
    expect(result).not.toHaveProperty("dstValAddress");
  });
});

describe("toTransactionRaw", () => {
  it("should convert into a transaction raw", () => {
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
      sourceValidator: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
      validators: [
        {
          address: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
          amount: "12345.67890",
        },
      ],
      amount: "1000000",
      recipient: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
      recipientDomain: {
        registry: "ens",
        domain: ".cosmos",
        address: "cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5",
        type: "forward",
      },
      valAddress: "cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
      dstValAddress: "cosmosvaloper1n229vhepft6wnkt5tjpwmxdmcnfz55jv3vp77d",
    });
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
      validators: undefined,
      valAddress: undefined,
      dstValAddress: undefined,
    } as unknown as Transaction);
    expect(result.networkInfo).toBeUndefined();
    expect(result.fees).toBeNull();
    expect(result.gas).toBeNull();
    expect(result.validators).toEqual([]);
    expect(result).not.toHaveProperty("valAddress");
    expect(result).not.toHaveProperty("dstValAddress");
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

  it("formats the legacy validators/sourceValidator shape", () => {
    const transaction: Transaction = {
      ...baseTransaction,
      mode: "redelegate",
      sourceValidator: "cosmosvaloper1source",
      validators: [{ address: "cosmosvaloper1dest", amount: new BigNumber(1000) }],
    };
    delete transaction.dstValAddress;
    delete transaction.valAddress;

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
    };

    const formatted = formatTransaction(transaction, account);

    expect(formatted).toContain("1 -> cosmosvaloper1n229vhepft6wnkt5tjpwmxdmcnfz55jv3vp77d");
    expect(formatted).toContain(
      "source validator=cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
    );
  });

  it("resolves a single validator via valAddress on delegate (no dstValAddress)", () => {
    const transaction: Transaction = {
      ...baseTransaction,
      mode: "delegate",
      validators: [],
      valAddress: "cosmosvaloper1single",
      sourceValidator: undefined,
    };
    delete transaction.dstValAddress;

    const formatted = formatTransaction(transaction, account);

    expect(formatted).toContain("1 -> cosmosvaloper1single");
    expect(formatted).not.toContain("source validator=");
  });

  it("omits the source validator line when there is none", () => {
    const transaction: Transaction = {
      ...baseTransaction,
      mode: "send",
      validators: [],
      sourceValidator: undefined,
    };

    const formatted = formatTransaction(transaction, account);

    expect(formatted).not.toContain("source validator=");
  });

  it("should format correctly a transaction", () => {
    const formatted = formatTransaction(baseTransaction, account);
    expect(formatted).toContain("SEND  1 ATOM");
    expect(formatted).toContain(
      "TO cosmos108uy5q9jt59gwugq5yrdhkzcd9jryslmpcstk5lfh8mc2yatfu6jg3vcy94rk6",
    );
    expect(formatted).toContain("1 -> cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2");
    expect(formatted).toContain(
      "source validator=cosmosvaloper1gf3dm2mvqhymts6ksrstlyuu2m8pw6dhfp9md2",
    );
    expect(formatted).toContain("with fees=0");
    expect(formatted).toContain("memo=test memo");
  });
});
