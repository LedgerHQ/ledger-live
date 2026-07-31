import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { VechainCoinConfig } from "../config";
import { createApi } from "./index";

const config: VechainCoinConfig = () => ({ status: { type: "active" } });

// Repo-committed VeChain mainnet address, already used by src/datasets/vechain.ts for bridge
// integration/dataset testing ("account information is fetched from the blockchain"). Reused
// here as a real, network-reachable address for balance-agnostic smoke assertions — its exact
// current balance is not asserted (only shape/type), mirroring coin-kaspa's FUNDED_SENDER smoke
// pattern but without asserting a specific non-zero balance we cannot guarantee ahead of time.
const KNOWN_ADDRESS = "0x0fe6688548f0C303932bB197B0A96034f1d74dba";

describe("createApi (integration)", () => {
  let api: CoinModuleApi;

  beforeAll(() => {
    api = createApi(config, "vechain");
  });

  // These methods throw synchronously (they never return a promise), so they are asserted with a
  // synchronous `expect(() => …).toThrow`, not `.rejects` (mirrors coin-kaspa's api integ test).
  it("getNextSequence throws (not applicable to Vechain's account model)", () => {
    expect(() => api.getNextSequence(KNOWN_ADDRESS)).toThrow(
      "getNextSequence is not applicable for Vechain",
    );
  });

  it("validates addresses via parseAddress", async () => {
    await expect(api.validateAddress(KNOWN_ADDRESS, {})).resolves.toBe(true);
    await expect(api.validateAddress("0xnot-an-address", {})).resolves.toBe(false);
  });

  it("getStakes / getRewards / getValidators throw (not supported)", () => {
    expect(() => api.getStakes(KNOWN_ADDRESS)).toThrow("getStakes is not supported");
    expect(() => api.getRewards(KNOWN_ADDRESS)).toThrow("getRewards is not supported");
    expect(() => api.getValidators()).toThrow("getValidators is not supported");
  });

  it("craftRawTransaction throws (not supported)", () => {
    expect(() => api.craftRawTransaction("raw", KNOWN_ADDRESS, "pubkey", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });

  describe("account & block methods (real network)", () => {
    it("getBalance returns both VET and VTHO balances", async () => {
      const balances = await api.getBalance(KNOWN_ADDRESS);

      expect(balances).toHaveLength(2);
      expect(balances.some(b => b.asset.type === "native")).toBe(true);
      expect(balances.some(b => b.asset.type !== "native")).toBe(true);
      for (const balance of balances) {
        expect(typeof balance.value).toBe("bigint");
        expect(balance.value).toBeGreaterThanOrEqual(0n);
      }
    });

    it("lastBlock returns the latest confirmed block", async () => {
      const info = await api.lastBlock();

      expect(info.height).toBeGreaterThan(0);
      expect(typeof info.hash).toBe("string");
      expect(info.time).toBeInstanceOf(Date);
    });

    it("getBlockInfo/getBlock agree on the same known height", async () => {
      const lastBlockInfo = await api.lastBlock();
      const knownHeight = lastBlockInfo.height - 100;

      const info = await api.getBlockInfo(knownHeight);
      const block = await api.getBlock(knownHeight);

      expect(info.height).toBe(knownHeight);
      expect(block.info).toEqual(info);
      expect(Array.isArray(block.transactions)).toBe(true);
    });

    it("listOperations returns a page shape for a known address", async () => {
      const page = await api.listOperations(KNOWN_ADDRESS, { minHeight: 0 });

      expect(Array.isArray(page.items)).toBe(true);
      for (const op of page.items) {
        expect(["IN", "OUT"]).toContain(op.type);
        expect(typeof op.value).toBe("bigint");
      }
    });
  });

  it("craftTransaction fails clearly for an intent with no recipient", async () => {
    await expect(
      api.craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: KNOWN_ADDRESS,
        recipient: "",
        amount: 1n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("vechain: recipient is required");
  });

  it("crafts a native VET transaction and combines it into a signed hex payload", async () => {
    const crafted = await api.craftTransaction({
      intentType: "transaction",
      type: "send",
      sender: KNOWN_ADDRESS,
      recipient: "0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86",
      amount: 1n,
      asset: { type: "native" },
    });

    const body = JSON.parse(crafted.transaction);
    expect(body.clauses).toHaveLength(1);
    expect(body.gas).toBeGreaterThan(0);
    expect(typeof crafted.details?.fee).toBe("string");

    // combine attaches a (dummy) 65-byte signature and returns the hex-encoded signed tx that
    // broadcast would submit — exercising the full craft → combine round trip.
    const signed = api.combine(crafted.transaction, "aa".repeat(65));
    expect(signed).toMatch(/^0x[0-9a-f]+$/);
  });
});
