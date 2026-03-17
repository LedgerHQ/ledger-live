import type { Balance, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { RecipientRequired, NotEnoughBalance, AmountRequired } from "@ledgerhq/errors";
import { validateIntent } from "../validateIntent";

const SENDER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const RECIPIENT = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";

function makeIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 1_000_000_000n,
    asset: { type: "native", name: "Solana" },
    ...overrides,
  };
}

function makeBalances(native = 5_000_000_000n, locked = 890_880n): Balance[] {
  return [{ value: native, asset: { type: "native" }, locked }];
}

describe("validateIntent (integration)", () => {
  it("should validate a correct native transfer", async () => {
    const result = await validateIntent(makeIntent(), makeBalances(), { value: 5000n });

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(1_000_000_000n);
    expect(result.estimatedFees).toBe(5000n);
    expect(result.totalSpent).toBe(1_000_000_000n + 5000n);
  });

  it("should return errors for missing recipient", async () => {
    const result = await validateIntent(makeIntent({ recipient: "" }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("should return errors when spending more than available", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 10_000_000_000n }),
      makeBalances(2_000_000_000n, 890_880n),
      { value: 5000n },
    );

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should return errors when amount is zero without useAllAmount", async () => {
    const result = await validateIntent(makeIntent({ amount: 0n }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should handle useAllAmount for native transfers", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 0n, useAllAmount: true }),
      makeBalances(2_000_000_000n, 890_880n),
      { value: 5000n },
    );

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(2_000_000_000n - 890_880n - 5000n);
  });
});
