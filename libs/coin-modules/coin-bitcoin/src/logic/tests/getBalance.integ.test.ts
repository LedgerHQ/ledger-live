import { getBalance } from "../getBalance";
import type { BitcoinContext } from "../../api/config";

const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

// Mainnet BIP44 (legacy) xpub taken from this module's fixtures. Its balance may be zero, so this
// smoke test asserts the SHAPE of the result rather than an amount. A known-history xpub with an
// equality assertion is the deferred coin-tester hardening (migration task).
const XPUB =
  "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn";

describe("logic/getBalance (integration)", () => {
  it("syncs the account against the explorer and returns a native balance", async () => {
    const balances = await getBalance(context, "bitcoin", XPUB, "44'/0'/0'");

    expect(balances).toHaveLength(1);
    expect(typeof balances[0].value).toBe("bigint");
    expect(balances[0].value >= 0n).toBe(true);
    expect(balances[0].asset).toEqual({ type: "native" });
  });
});
