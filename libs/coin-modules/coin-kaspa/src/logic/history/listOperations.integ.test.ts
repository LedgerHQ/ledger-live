import { publicKeyToAddress } from "../kaspaAddresses";
import { listOperations } from "./listOperations";

// See getBalance.integ.test.ts: a freshly-derived address has no on-chain history.
const PRISTINE_ADDRESS = publicKeyToAddress(Buffer.alloc(32, 0xdd));
// Dedicated, independently-funded Kaspa account (see getBalance.integ.test.ts). The funding
// transaction itself gives it on-chain history, so it has ≥ 1 operation.
const ACTIVE_ADDRESS = "kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp";

describe("listOperations (integration)", () => {
  it("returns an empty page for a pristine address", async () => {
    const page = await listOperations(PRISTINE_ADDRESS, { minHeight: 0 });

    expect(page.items).toEqual([]);
  });

  describe("standard address with history", () => {
    it("returns at least one operation with IN/OUT metadata (api.mdx)", async () => {
      const page = await listOperations(ACTIVE_ADDRESS, { minHeight: 0 });

      expect(page.items.length).toBeGreaterThan(0);
      for (const op of page.items) {
        expect(["IN", "OUT"]).toContain(op.type);
        expect(typeof op.value).toBe("bigint");
        expect(op.tx.hash).toEqual(expect.any(String));
        expect(op.asset).toEqual({ type: "native", name: "KAS" });
      }
    });
  });
});
