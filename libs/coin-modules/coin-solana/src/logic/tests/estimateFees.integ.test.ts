import { getChainAPI } from "../../network";
import { estimateFees } from "../estimateFees";

const api = getChainAPI({ endpoint: "https://solana.coin.ledger.com" });

const TEST_ADDRESS = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";
const TEST_RECIPIENT = "HYe4vSaEGqQKnDrxWDrk3o5H2gznv7qtij5G6NNG8WHd";

describe("estimateFees (integration)", () => {
  it("returns a positive fee estimation for a transfer intent", async () => {
    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1_000_000n,
      asset: { type: "native" },
    });

    expect(result.value).toBeGreaterThan(0n);
  });
});
