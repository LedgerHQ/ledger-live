import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { validateIntent } from "./validateIntent";

const SENDER = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

function intent(overrides: Partial<TransactionIntent> = {}): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 100000n,
    asset: { type: "native" },
    ...overrides,
  };
}

function nativeBalance(value: bigint): Balance[] {
  return [{ value, asset: { type: "native", name: "KAS" } }];
}

describe("validateIntent", () => {
  it("passes a valid send intent with sufficient balance", async () => {
    const result = await validateIntent(intent(), nativeBalance(1000000n), { value: 1000n });

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(100000n);
    expect(result.totalSpent).toBe(101000n);
  });

  it("rejects a missing recipient", async () => {
    const result = await validateIntent(intent({ recipient: "" }), nativeBalance(1000000n));

    expect(result.errors.recipient).toBeInstanceOf(Error);
  });

  it("rejects a malformed recipient address", async () => {
    const result = await validateIntent(
      intent({ recipient: "not-a-kaspa-address" }),
      nativeBalance(1000000n),
    );

    expect(result.errors.recipient).toBeInstanceOf(Error);
  });

  it("rejects a non-positive amount", async () => {
    const result = await validateIntent(intent({ amount: 0n }), nativeBalance(1000000n));

    expect(result.errors.amount).toBeInstanceOf(Error);
  });

  it("rejects an intent whose amount + fees exceed the available balance", async () => {
    const result = await validateIntent(intent({ amount: 900000n }), nativeBalance(1000000n), {
      value: 200000n,
    });

    expect(result.errors.amount).toBeInstanceOf(Error);
  });

  it("warns when the fee exceeds 10% of the sent amount", async () => {
    const result = await validateIntent(intent({ amount: 100000n }), nativeBalance(1000000n), {
      value: 15000n,
    });

    expect(result.warnings.feeTooHigh).toBeInstanceOf(Error);
  });

  it("resolves the spendable amount for a useAllAmount intent", async () => {
    const result = await validateIntent(
      intent({ useAllAmount: true, amount: 0n }),
      nativeBalance(1000000n),
      { value: 1000n },
    );

    expect(result.errors.amount).toBeUndefined();
    expect(result.amount).toBe(999000n);
  });
});
