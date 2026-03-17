import { STAKE_SEED_PREFIX, createStakeAccountSeed } from "./stakeAccountSeed";

const STAKE_SEED_MAX_BYTES = 32;

describe("stakeAccountSeed", () => {
  describe("createStakeAccountSeed", () => {
    it("returns seed with prefix stake:", () => {
      const seed = createStakeAccountSeed();
      expect(seed.startsWith(STAKE_SEED_PREFIX)).toBe(true);
    });

    it("returns seed with exactly 26 hex chars after prefix (32 bytes total)", () => {
      const seed = createStakeAccountSeed();
      expect(seed).toMatch(/^stake:[0-9a-f]{26}$/);
      expect(seed.length).toBe(STAKE_SEED_PREFIX.length + 26);
    });

    it("returns seed <= 32 bytes for Solana createWithSeed limit", () => {
      for (let i = 0; i < 20; i++) {
        const seed = createStakeAccountSeed();
        expect(Buffer.byteLength(seed, "utf8")).toBeLessThanOrEqual(STAKE_SEED_MAX_BYTES);
      }
    });

    it("returns unique seeds across multiple calls", () => {
      const seeds = new Set<string>();
      for (let i = 0; i < 100; i++) {
        seeds.add(createStakeAccountSeed());
      }
      expect(seeds.size).toBe(100);
    });
  });
});
