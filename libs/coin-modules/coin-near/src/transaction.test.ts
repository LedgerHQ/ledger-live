import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import transaction, {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
} from "./transaction";
import type { Transaction, TransactionRaw } from "./types";

const account = {
  type: "Account",
  currency: { units: [{ code: "NEAR", name: "NEAR", magnitude: 24 }] },
} as unknown as Account;

const tx = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "near",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "recipient.near",
    useAllAmount: false,
    fees: null,
    ...overrides,
  }) as Transaction;

const raw = (overrides: Partial<TransactionRaw> = {}): TransactionRaw =>
  ({
    family: "near",
    mode: "send",
    amount: "0",
    recipient: "recipient.near",
    useAllAmount: false,
    fees: null,
    ...overrides,
  }) as TransactionRaw;

describe("formatTransaction", () => {
  it("renders MAX instead of an amount when the transaction sweeps the account", () => {
    const formatted = formatTransaction(
      tx({ mode: "send", amount: new BigNumber("1000000000000000000000000"), useAllAmount: true }),
      account,
    );

    expect(formatted).toContain("MAX");
    expect(formatted).not.toContain("1 NEAR");
  });

  it("renders the formatted amount with its currency code", () => {
    const formatted = formatTransaction(
      tx({ amount: new BigNumber("1500000000000000000000000") }),
      account,
    );

    expect(formatted.replace(/\u00a0/g, " ")).toContain("1.5 NEAR");
  });

  it("omits the amount when it is zero and the transaction does not sweep", () => {
    const formatted = formatTransaction(tx({ amount: new BigNumber(0) }), account);

    expect(formatted).not.toContain("NEAR");
  });

  it("uppercases the mode", () => {
    expect(formatTransaction(tx({ mode: "unstake" }), account)).toContain("UNSTAKE");
  });

  it("appends the recipient line only when there is a recipient", () => {
    expect(formatTransaction(tx({ recipient: "pool.poolv1.near" }), account)).toContain(
      "TO pool.poolv1.near",
    );
    expect(formatTransaction(tx({ recipient: "" }), account)).not.toContain("TO");
  });
});

describe("fromTransactionRaw", () => {
  it("revives an estimated fee as a BigNumber", () => {
    const restored = fromTransactionRaw(raw({ fees: "15000000000000000000000" }));

    expect(BigNumber.isBigNumber(restored.fees)).toBe(true);
    expect(restored.fees?.toFixed()).toBe("15000000000000000000000");
  });

  it("keeps an unestimated fee as null rather than coercing it to zero", () => {
    const withoutFees: Partial<TransactionRaw> = { ...raw() };
    delete withoutFees.fees;

    expect(fromTransactionRaw(raw({ fees: null })).fees).toBeNull();
    expect(fromTransactionRaw(withoutFees as TransactionRaw).fees).toBeNull();
  });

  it("revives the nonce as a BigNumber", () => {
    const restored = fromTransactionRaw(raw({ nonce: "126857085000047" }));

    expect(BigNumber.isBigNumber(restored.nonce)).toBe(true);
    expect(restored.nonce?.toFixed()).toBe("126857085000047");
  });

  it("leaves the nonce key absent when the raw transaction carries none", () => {
    expect("nonce" in fromTransactionRaw(raw())).toBe(false);
  });

  it("carries family, mode and the common fields across", () => {
    const restored = fromTransactionRaw(
      raw({ mode: "withdraw", amount: "42", recipient: "pool.poolv1.near", useAllAmount: true }),
    );

    expect(restored.family).toBe("near");
    expect(restored.mode).toBe("withdraw");
    expect(restored.amount.toFixed()).toBe("42");
    expect(restored.recipient).toBe("pool.poolv1.near");
    expect(restored.useAllAmount).toBe(true);
  });
});

describe("toTransactionRaw", () => {
  it("serializes an estimated fee to a decimal string", () => {
    expect(toTransactionRaw(tx({ fees: new BigNumber("15000000000000000000000") })).fees).toBe(
      "15000000000000000000000",
    );
  });

  it("serializes an unestimated fee as null", () => {
    const withoutFees: Partial<Transaction> = { ...tx() };
    delete withoutFees.fees;

    expect(toTransactionRaw(tx({ fees: null })).fees).toBeNull();
    expect(toTransactionRaw(withoutFees as Transaction).fees).toBeNull();
  });

  it("serializes the nonce to a decimal string", () => {
    expect(toTransactionRaw(tx({ nonce: new BigNumber("126857085000047") })).nonce).toBe(
      "126857085000047",
    );
  });

  it("leaves the nonce key absent when the transaction carries none", () => {
    expect("nonce" in toTransactionRaw(tx())).toBe(false);
  });
});

describe("round trip", () => {
  it("restores an estimated transaction unchanged", () => {
    const original = tx({
      mode: "unstake",
      amount: new BigNumber("2902170000000000000000000"),
      recipient: "figment.poolv1.near",
      fees: new BigNumber("15000000000000000000000"),
      nonce: new BigNumber("126857085000047"),
    });

    const restored = fromTransactionRaw(
      JSON.parse(JSON.stringify(toTransactionRaw(original))) as TransactionRaw,
    );

    expect(restored.mode).toBe(original.mode);
    expect(restored.recipient).toBe(original.recipient);
    expect(restored.amount.toFixed()).toBe(original.amount.toFixed());
    expect(restored.fees?.toFixed()).toBe(original.fees?.toFixed());
    expect(restored.nonce?.toFixed()).toBe(original.nonce?.toFixed());
  });

  it("restores an unestimated transaction without inventing a fee or a nonce", () => {
    const restored = fromTransactionRaw(
      JSON.parse(JSON.stringify(toTransactionRaw(tx()))) as TransactionRaw,
    );

    expect(restored.fees).toBeNull();
    expect("nonce" in restored).toBe(false);
  });

  it("round-trips a zero nonce", () => {
    const restored = fromTransactionRaw(toTransactionRaw(tx({ nonce: new BigNumber(0) })));

    expect(restored.nonce?.toFixed()).toBe("0");
  });
});

describe("default export", () => {
  it("exposes the serializers the bridge loads", () => {
    expect(transaction.formatTransaction).toBe(formatTransaction);
    expect(transaction.fromTransactionRaw).toBe(fromTransactionRaw);
    expect(transaction.toTransactionRaw).toBe(toTransactionRaw);
    expect(typeof transaction.fromTransactionStatusRaw).toBe("function");
    expect(typeof transaction.toTransactionStatusRaw).toBe("function");
    expect(typeof transaction.formatTransactionStatus).toBe("function");
  });
});
