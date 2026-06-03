import { TEST_ADDRESSES } from "../test/fixtures";
import { estimateFees } from "./estimateFees";

describe("estimateFees (integration)", () => {
  it("returns a FeeEstimation with value > 0 and gas parameters for native intent", async () => {
    const intent = {
      type: "send" as const,
      sender: TEST_ADDRESSES.F1_ADDRESS,
      recipient: TEST_ADDRESSES.RECIPIENT_F1,
      amount: 1_000_000_000_000_000_000n,
      asset: { type: "native" as const },
      useAllAmount: false,
    };

    const result = await estimateFees(intent);

    expect(typeof result.value).toBe("bigint");
    expect(result.value).toBeGreaterThan(0n);
    expect(result.parameters).toBeDefined();
    expect(result.parameters!["gasFeeCap"]).toBeDefined();
    expect(result.parameters!["gasLimit"]).toBeDefined();
    expect(result.parameters!["gasPremium"]).toBeDefined();
  });
});
