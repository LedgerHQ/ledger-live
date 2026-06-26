import { UserSigner } from "@multiversx/sdk-core";
import { UserSecretKey } from "@multiversx/sdk-core/out/wallet/userKeys";
import { randomBytes } from "crypto";
import MultiversXApiClient from "../api/apiCalls";
import { getBalance } from "./getBalance";

// Real MultiversX mainnet endpoints (same as api/index.integ.test.ts).
const API_ENDPOINT = "https://elrond.coin.ledger.com";
const DELEGATION_API_ENDPOINT = "https://delegations-elrond.coin.ledger.com";
const api = new MultiversXApiClient(API_ENDPOINT, DELEGATION_API_ENDPOINT);

// Known mainnet addresses, sourced from the MultiversX Explorer.
const FUNDED_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const WITH_TOKENS = "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2";
const ZERO_BALANCE = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu";
// Valid bech32 address derived from a random key — almost certainly unfunded.
const UNFUNDED_ADDRESS = new UserSigner(new UserSecretKey(randomBytes(32))).getAddress().bech32();

jest.setTimeout(60_000);

describe("getBalance (integration)", () => {
  it("returns the native EGLD balance first for a funded account", async () => {
    const balances = await getBalance(api, FUNDED_ADDRESS);

    expect(balances.length).toBeGreaterThanOrEqual(1);

    const [native] = balances;
    expect(native.asset).toEqual({ type: "native" });
    expect(typeof native.value).toBe("bigint");
    expect(native.value).toBeGreaterThanOrEqual(0n);
  });

  it("always returns a native balance, even for a zero-balance account (FR4)", async () => {
    const balances = await getBalance(api, ZERO_BALANCE);

    expect(balances.length).toBeGreaterThanOrEqual(1);
    expect(balances[0].asset).toEqual({ type: "native" });
  });

  it("returns well-formed ESDT token balances after the native balance", async () => {
    const balances = await getBalance(api, WITH_TOKENS);

    expect(balances[0].asset).toEqual({ type: "native" });

    for (const balance of balances.slice(1)) {
      expect(balance.asset.type).toBe("esdt");
      expect(balance.asset).toHaveProperty("assetReference");
      expect(typeof balance.value).toBe("bigint");
      expect(balance.value).toBeGreaterThanOrEqual(0n);
    }
  });

  it("returns a single native balance for an unfunded account", async () => {
    const balances = await getBalance(api, UNFUNDED_ADDRESS);

    expect(balances).toHaveLength(1);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].value).toBe(0n);
  });

  it("throws for an invalid address", async () => {
    await expect(getBalance(api, "not-a-valid-address")).rejects.toThrow(
      /Invalid MultiversX address/,
    );
  });
});
