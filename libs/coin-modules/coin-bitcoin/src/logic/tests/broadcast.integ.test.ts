import { broadcast } from "../broadcast";
import type { BitcoinContext } from "../../api/config";

// Endpoint resolved from the currency (getEnv), not the config — same as the other integ suites.
const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

describe("logic/broadcast (integration)", () => {
  // `broadcast` MUST throw (never swallow) when the explorer rejects a transaction. A malformed raw
  // tx is rejected by the real Ledger explorer v4 `/tx/send`, so no funds are spent and the
  // error-handling path is validated against the live endpoint.
  it("throws when the explorer rejects a malformed raw transaction", async () => {
    await expect(broadcast(context, "bitcoin", "00", undefined)).rejects.toThrow();
  });
});
