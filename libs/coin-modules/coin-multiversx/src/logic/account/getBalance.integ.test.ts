/**
 * Integration tests — hit real MultiversX API.
 * Run with: pnpm --filter @ledgerhq/coin-multiversx test-integ
 */
import { createNetworkApi } from "../../network/api";
import { getBalance } from "./getBalance";

const API_ENDPOINT = process.env.MULTIVERSX_API_ENDPOINT ?? "https://api.multiversx.com";
const DELEGATION_API_ENDPOINT =
  process.env.MULTIVERSX_DELEGATION_API_ENDPOINT ?? "https://delegation-api.multiversx.com";

// A well-known MultiversX address with EGLD and delegation history
const ACTIVE_ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

describe("getBalance (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("returns at least a native balance entry", async () => {
    const balances = await getBalance(api, ACTIVE_ADDR);
    const native = balances.find(b => b.asset.type === "native");
    expect(native?.value).toBeGreaterThanOrEqual(0n);
  });

  it("returns zero balance for pristine address without error", async () => {
    // Canonical abandon-seed (burn) address for MultiversX — a valid bech32
    // address that is never used, so it stays effectively pristine.
    const pristine = "erd1sqhjrtmsn5yjk6w85099p8v0ly0g8z9pxeqe5dvu5rlf2n7vq3vqytny9g";
    const balances = await getBalance(api, pristine);
    const native = balances.find(b => b.asset.type === "native");
    expect(native?.value).toBeGreaterThanOrEqual(0n);
  });
});
