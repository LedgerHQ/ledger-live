import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { validateIntent } from "./validateIntent";

const SENDER = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

// 1 KAS = 100_000_000 sompi. Use amounts well above the 20_000_000 sompi dust limit by default.
const ONE_KAS = 100_000_000n;

function intent(overrides: Partial<TransactionIntent> = {}): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: ONE_KAS, // 1 KAS — above dust limit
    asset: { type: "native" },
    ...overrides,
  };
}

function nativeBalance(value: bigint): Balance[] {
  return [{ value, asset: { type: "native", name: "KAS" } }];
}

describe("validateIntent", () => {
  it("passes a valid send intent with sufficient balance", async () => {
    const result = await validateIntent(intent(), nativeBalance(10n * ONE_KAS), { value: 1000n });

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(ONE_KAS);
    expect(result.totalSpent).toBe(ONE_KAS + 1000n);
  });

  it("rejects a missing recipient", async () => {
    const result = await validateIntent(intent({ recipient: "" }), nativeBalance(10n * ONE_KAS));

    expect(result.errors.recipient).toBeInstanceOf(Error);
  });

  it("rejects a malformed recipient address", async () => {
    const result = await validateIntent(
      intent({ recipient: "not-a-kaspa-address" }),
      nativeBalance(10n * ONE_KAS),
    );

    expect(result.errors.recipient).toBeInstanceOf(Error);
  });

  it("rejects a non-positive amount", async () => {
    const result = await validateIntent(intent({ amount: 0n }), nativeBalance(10n * ONE_KAS));

    expect(result.errors.amount?.name).toBe("AmountRequired");
  });

  it("rejects an amount below the KIP-9 dust limit (DustLimit)", async () => {
    // 1 sompi is below the 20,000,000 sompi (0.2 KAS) KIP-9 storage mass floor.
    const result = await validateIntent(intent({ amount: 1n }), nativeBalance(10n * ONE_KAS));

    expect(result.errors.amount?.name).toBe("DustLimit");
  });

  it("dust limit does not apply to useAllAmount (send-max handles it at craft time)", async () => {
    const result = await validateIntent(
      intent({ useAllAmount: true, amount: 0n }),
      nativeBalance(10n * ONE_KAS),
      { value: 1000n },
    );

    expect(result.errors.amount).toBeUndefined();
    expect(result.amount).toBe(10n * ONE_KAS - 1000n);
  });

  it("rejects an intent whose amount + fees exceed the available balance", async () => {
    const result = await validateIntent(intent({ amount: 9n * ONE_KAS }), nativeBalance(10n * ONE_KAS), {
      value: 2n * ONE_KAS,
    });

    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("warns when the fee exceeds 10% of the sent amount", async () => {
    const result = await validateIntent(intent({ amount: ONE_KAS }), nativeBalance(10n * ONE_KAS), {
      value: 15_000_000n, // 0.15 KAS — 15% of 1 KAS
    });

    expect(result.warnings.feeTooHigh).toBeInstanceOf(Error);
  });

  it("resolves the spendable amount for a useAllAmount intent", async () => {
    const result = await validateIntent(
      intent({ useAllAmount: true, amount: 0n }),
      nativeBalance(10n * ONE_KAS),
      { value: 1000n },
    );

    expect(result.errors.amount).toBeUndefined();
    expect(result.amount).toBe(10n * ONE_KAS - 1000n);
  });
});
