import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from ".";
import { type CardanoConfig } from "../config";

type TokenAsset = Extract<AssetInfo, { type: "token" }>;

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

// A real mainnet address that holds native tokens, exercises both the native-ADA and token
// branches of getBalance through the public CoinModule API surface.
const TOKEN_HOLDING_ADDRESS =
  "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9";

describe("getBalance (integration)", () => {
  // Exercise the API surface (createApi), not the logic function directly — this also covers
  // the rejectBalanceOptions wrapper that guards the public contract.
  const api = createApi(config, "cardano");
  let balances: Balance[];

  beforeAll(async () => {
    balances = await api.getBalance(TOKEN_HOLDING_ADDRESS);
  }, 30000);

  it("returns the native ADA balance as the first entry", () => {
    expect(balances.length).toBeGreaterThanOrEqual(1);

    const native = balances[0];
    expect(native.asset.type).toBe("native");
    expect(typeof native.value).toBe("bigint");
    expect(native.value).toBeGreaterThan(0n);
    // The locked (non-spendable) portion can never exceed the total native value.
    expect(native.value).toBeGreaterThanOrEqual(native.locked ?? 0n);
  });

  it("returns token balance entries for the address's native tokens", () => {
    const tokenBalances = balances.filter(
      (b): b is Balance & { asset: TokenAsset } => b.asset.type === "token",
    );
    expect(tokenBalances.length).toBeGreaterThanOrEqual(1);

    for (const token of tokenBalances) {
      expect(token.value).toBeGreaterThan(0n);
      // Canonical Cardano asset id: policyId (28-byte / 56-hex) concatenated with the asset
      // name, no separator. assetOwner echoes the queried address.
      expect(token.asset.assetReference).toMatch(/^[0-9a-f]{56}/);
      expect(token.asset.assetOwner).toBe(TOKEN_HOLDING_ADDRESS);
    }
  });

  it("rejects unsupported balance options instead of silently dropping them", async () => {
    await expect(api.getBalance(TOKEN_HOLDING_ADDRESS, {} as never)).rejects.toThrow(
      "getBalance does not support the options parameter",
    );
  });
});
