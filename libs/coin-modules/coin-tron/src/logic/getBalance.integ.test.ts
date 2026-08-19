import type { TronCoinConfig } from "../config";
import coinConfig from "../config";
import { getBalance } from "./getBalance";

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

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
    const balances = await getBalance(mockConfig, "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9");

    expect(balances[0].asset).toEqual({ type: "native" });
    // Backend either returns trc10 or trc20 first (randomly)
    balances
      .slice(1)
      .forEach(balance => expect(["trc20", "trc10"].includes(balance.asset.type)).toBe(true));
    balances.forEach(balance => expect(balance.value).toBeGreaterThanOrEqual(0));
  });

  it("returns 0 when account is not activated", async () => {
    const result = await getBalance(mockConfig, "TXFeV31qgUQYMLog3axKJeEBbXpQFtHsXD");

    expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" } }]);
  });

  it("propagates upstream API errors for an invalid address", async () => {
    await expect(getBalance(mockConfig, "TPqmGMoidNTbMZ8ApgcbPMf7JDyiHi1sv0")).rejects.toThrow(
      /valid account address/i,
    );
  });
});
