import type {
  Balance,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { validateIntent } from "./validateIntent";

const currency = getCryptoCurrencyById("cardano");
const SENDER =
  "addr1q8mgw8geggkl2hs0m6rq3pgt69uxttpqcgu6euxje5tt6plxjtjrnskhhtt03g6l3sr98p9t8mtlajr26vmwjzep77pqxn8cms";
const RECIPIENT =
  "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9";

const balances = (value: bigint, locked = 0n): Balance[] => [
  { asset: { type: "native" }, value, locked },
];

const TOKEN_REF = "1234567890123456789012345678901234567890123456789012345a.4d59544f4b454e";
const tokenAsset = { type: "token", assetReference: TOKEN_REF, assetOwner: SENDER } as const;

const tokenBalances = (tokenValue: bigint, nativeValue = 10_000_000n): Balance[] => [
  { asset: { type: "native" }, value: nativeValue },
  { asset: tokenAsset, value: tokenValue },
];

function intent(over: Partial<TransactionIntent<StringMemo>> = {}): TransactionIntent<StringMemo> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 2_000_000n,
    asset: { type: "native" },
    ...over,
  } as TransactionIntent<StringMemo>;
}

describe("validateIntent", () => {
  it("validates a fundable native transfer and computes amount + totalSpent", async () => {
    const res = await validateIntent(currency, intent(), balances(10_000_000n), {
      value: 1_000_000n,
    });

    expect(res.errors).toEqual({});
    expect(res.estimatedFees).toBe(1_000_000n);
    expect(res.amount).toBe(2_000_000n);
    expect(res.totalSpent).toBe(3_000_000n);
  });

  it.each([
    ["", "RecipientRequired"],
    [SENDER, "InvalidAddressBecauseDestinationIsAlsoSource"],
    ["not-an-address", "InvalidAddress"],
  ])("flags recipient %p", async (recipient, name) => {
    const res = await validateIntent(currency, intent({ recipient }), balances(10_000_000n));
    expect(res.errors.recipient?.name).toBe(name);
  });

  it("flags a zero amount", async () => {
    const res = await validateIntent(currency, intent({ amount: 0n }), balances(10_000_000n));
    expect(res.errors.amount?.name).toBe("AmountRequired");
  });

  it("flags amount + fees exceeding the spendable balance", async () => {
    const res = await validateIntent(
      currency,
      intent({ amount: 10_000_000n }),
      balances(10_000_000n),
      {
        value: 1_000_000n,
      },
    );
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("computes max spendable for useAllAmount (balance − fees)", async () => {
    const res = await validateIntent(
      currency,
      intent({ useAllAmount: true, amount: 0n }),
      balances(10_000_000n),
      { value: 1_000_000n },
    );
    expect(res.errors).toEqual({});
    expect(res.amount).toBe(9_000_000n);
    expect(res.totalSpent).toBe(10_000_000n);
  });

  it("validates a token transfer against the token balance, with fees excluded from totalSpent", async () => {
    const res = await validateIntent(
      currency,
      intent({ asset: tokenAsset, amount: 500n }),
      tokenBalances(1_000n),
      { value: 1_000_000n },
    );
    expect(res.errors).toEqual({});
    // The ADA fee must not be compared against the token amount (different units) — no feeTooHigh.
    expect(res.warnings).toEqual({});
    expect(res.amount).toBe(500n);
    expect(res.totalSpent).toBe(500n);
  });

  it("flags a token transfer the native balance cannot cover the fee for", async () => {
    const res = await validateIntent(
      currency,
      intent({ asset: tokenAsset, amount: 500n }),
      tokenBalances(1_000n, 0n),
      { value: 1_000_000n },
    );
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("flags a token transfer exceeding the token balance (not the native balance)", async () => {
    const res = await validateIntent(
      currency,
      intent({ asset: tokenAsset, amount: 2_000n }),
      tokenBalances(1_000n),
      { value: 1_000_000n },
    );
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("computes max spendable for a useAllAmount token transfer (full token balance)", async () => {
    const res = await validateIntent(
      currency,
      intent({ asset: tokenAsset, useAllAmount: true, amount: 0n }),
      tokenBalances(1_000n),
      { value: 1_000_000n },
    );
    expect(res.errors).toEqual({});
    expect(res.amount).toBe(1_000n);
    expect(res.totalSpent).toBe(1_000n);
  });

  it("warns feeTooHigh on a native transfer whose fee exceeds 10% of the amount", async () => {
    const res = await validateIntent(
      currency,
      intent({ amount: 500_000n }),
      balances(10_000_000n),
      {
        value: 1_000_000n,
      },
    );
    expect(res.errors).toEqual({});
    expect(res.warnings.feeTooHigh?.name).toBe("FeeTooHigh");
  });

  it("flags a memo longer than the Cardano metadata limit", async () => {
    const res = await validateIntent(
      currency,
      intent({ memo: { type: "string", kind: "text", value: "a".repeat(65) } }),
      balances(10_000_000n),
    );
    expect(res.errors.transaction?.name).toBe("CardanoMemoExceededSizeError");
  });
});
