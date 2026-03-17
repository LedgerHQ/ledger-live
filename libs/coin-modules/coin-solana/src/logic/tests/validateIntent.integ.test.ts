import type { Balance, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { validateIntent } from "../validateIntent";

const SENDER = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";
const RECIPIENT = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

describe("validateIntent (real RPC)", () => {
  it("should validate a basic native transfer intent", async () => {
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 100_000n,
      asset: { type: "native", name: "Solana" },
    };

    const balances: Balance[] = [
      { value: 1_000_000_000n, asset: { type: "native" }, locked: 890_880n },
    ];

    const result = await validateIntent(intent, balances, { value: 5000n });

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(100_000n);
    expect(result.estimatedFees).toBe(5000n);
    expect(result.totalSpent).toBe(105_000n);
  });
});
