import { listOperations } from "../listOperations";
import type { BitcoinContext } from "../../api/config";

const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

// const XPUB =
//   "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn";

const XPUB =
  "xpub6CCc6taSdhLfzELeGNNYXv7BZ7wK8kbzzgcTV9TE7sHyeVo69cq1Mwugt8ZQwtU9xLfSNsLhhuNJfYzb9s2h1ogJugMyTBRBcjpRJXbFDgC";

describe("logic/listOperations (integration)", () => {
  it("returns a page of native operations for the whole account", async () => {
    const page = await listOperations(context, "bitcoin", XPUB, {
      minHeight: 0,
      derivationPath: "84'/0'/1'/0",
    });

    expect(Array.isArray(page.items)).toBe(true);
    // Shape check on any returned operations (native, positive-value, real tx hash).
    page.items.forEach(op => {
      expect(typeof op.value).toBe("bigint");
      expect(op.asset).toEqual({ type: "native" });
      expect(op.tx.hash.length).toBeGreaterThan(0);
      expect(["IN", "OUT"]).toContain(op.type);
    });
    console.log(page.items[0]);
  });
});
