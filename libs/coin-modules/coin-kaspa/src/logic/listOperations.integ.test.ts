import { publicKeyToAddress } from "./kaspaAddresses";
import { listOperations } from "./listOperations";

// See getBalance.integ.test.ts: a freshly-derived address has no on-chain history.
const PRISTINE_ADDRESS = publicKeyToAddress(Buffer.alloc(32, 0xdd));

describe("listOperations (integration)", () => {
  it("returns an empty page for a pristine address", async () => {
    const page = await listOperations(PRISTINE_ADDRESS, { minHeight: 0 });

    expect(page.items).toEqual([]);
  });

  // FIXME: requires a maintained real Kaspa address known to have transaction history.
  // No such fixture could be verified from this environment (no network access to the Kaspa
  // endpoint) — enable once a standard/active address is confirmed against api.mdx's
  // expectations (≥ N operations, IN/OUT metadata present).
  describe.skip("standard address with history", () => {
    it("returns at least one operation with IN/OUT metadata", async () => {
      throw new Error("FIXME: supply a verified active kaspa: address fixture");
    });
  });
});
