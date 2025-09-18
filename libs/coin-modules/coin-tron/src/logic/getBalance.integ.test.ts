import coinConfig from "../config";
import { getBalance } from "./getBalance";

describe("getBalance", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    }));
  });

  it("fetches native and token balances for TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9", async () => {
    const balances = await getBalance("TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9");

    expect(balances[0].asset).toEqual({ type: "native" });
    // Backend either returns trc10 or trc20 first (randomly)
    balances
      .slice(1)
      .forEach(balance => expect(["trc20", "trc10"].includes(balance.asset.type)).toBe(true));
    balances.forEach(balance => expect(balance.value).toBeGreaterThanOrEqual(0));
  });
});
