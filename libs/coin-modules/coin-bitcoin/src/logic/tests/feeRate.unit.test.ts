import { feePerByteOverride, resolveFeePerByte } from "../feeRate";
import type { Account as WalletBtcAccount } from "@ledgerhq/wallet-btc/account";

const accountWithFees = (fees: Record<string, unknown>): WalletBtcAccount =>
  ({ xpub: { explorer: { getFees: async () => fees } } }) as unknown as WalletBtcAccount;

describe("logic/feeRate", () => {
  describe("feePerByteOverride", () => {
    it("returns a positive numeric override as-is", () => {
      expect(feePerByteOverride({ feePerByte: 12 })).toBe(12);
    });

    it("parses a numeric-string override and ceils to a whole sat/vB", () => {
      expect(feePerByteOverride({ feePerByte: "5.4" })).toBe(6);
    });

    it("returns undefined when absent, zero, negative, or non-numeric", () => {
      expect(feePerByteOverride(undefined)).toBeUndefined();
      expect(feePerByteOverride({})).toBeUndefined();
      expect(feePerByteOverride({ feePerByte: 0 })).toBeUndefined();
      expect(feePerByteOverride({ feePerByte: -3 })).toBeUndefined();
      expect(feePerByteOverride({ feePerByte: "abc" })).toBeUndefined();
    });
  });

  describe("resolveFeePerByte", () => {
    it("converts sat/kvB targets to sat/vB and picks the middle target", async () => {
      // [ceil(2435/1000)=3, ceil(1241/1000)=2, ceil(1009/1000)=2]; median index 1 → 2
      const rate = await resolveFeePerByte(
        accountWithFees({ "2": 2435, "3": 1241, "6": 1009, last_updated: 1 }),
      );
      expect(rate).toBe(2);
    });

    it("floors each rate at 1 sat/vB", async () => {
      expect(await resolveFeePerByte(accountWithFees({ "1": 100 }))).toBe(1);
    });

    it("falls back to 1 when the explorer returns no numeric targets", async () => {
      expect(await resolveFeePerByte(accountWithFees({ last_updated: 1 }))).toBe(1);
    });
  });
});
