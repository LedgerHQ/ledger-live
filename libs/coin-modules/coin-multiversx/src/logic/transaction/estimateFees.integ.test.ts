/**
 * Integration tests — estimateFees is pure (no network calls), but we still
 * validate the values are within expected ranges.
 */
import { estimateFees } from "./estimateFees";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { GAS_PRICE, MIN_GAS_LIMIT } from "../../constants";

const SENDER = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

describe("estimateFees (integ)", () => {
  it("native fee equals MIN_GAS_LIMIT * GAS_PRICE", async () => {
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: SENDER,
      amount: 1000n,
      asset: { type: "native" },
    };
    const fee = await estimateFees(intent);
    expect(fee.value).toBe(BigInt(MIN_GAS_LIMIT) * BigInt(GAS_PRICE));
  });
});
