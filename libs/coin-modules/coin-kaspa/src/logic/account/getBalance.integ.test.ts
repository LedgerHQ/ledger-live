import { publicKeyToAddress } from "../kaspaAddresses";
import { getBalance } from "./getBalance";

// A freshly-derived address (from a hash pattern not otherwise used in this codebase) has never
// been broadcast anywhere, so it is pristine with overwhelming probability — avoids hardcoding a
// specific real address whose current on-chain balance we cannot verify from this environment.
const PRISTINE_ADDRESS = publicKeyToAddress(Buffer.alloc(32, 0xee));
// Dedicated, independently-generated Kaspa account (NOT derived from a Ledger test seed),
// funded once and intentionally never spent, so its native balance stays > 0 as a stable
// integration fixture. Verify on
// https://explorer.kaspa.org/addresses/kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp
const FUNDED_ADDRESS = "kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp";

describe("getBalance (integration)", () => {
  it("returns a zero native balance for a pristine address", async () => {
    const balances = await getBalance(PRISTINE_ADDRESS);

    expect(balances).toEqual([{ value: 0n, asset: { type: "native", name: "KAS" } }]);
  });

  describe("funded address", () => {
    it("returns a positive native balance", async () => {
      const balances = await getBalance(FUNDED_ADDRESS);

      expect(balances).toHaveLength(1);
      expect(balances[0].asset).toEqual({ type: "native", name: "KAS" });
      expect(balances[0].value).toBeGreaterThan(0n);
    });
  });
});
