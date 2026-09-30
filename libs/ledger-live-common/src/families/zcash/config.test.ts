import type { ZcashCoinConfig } from "@ledgerhq/coin-zcash/config";
import { bitcoinConfig } from "../bitcoin/config";

// The shipped default is what a release uses until the remote config says otherwise: a mainnet
// endpoint left on a staging host reaches every user.
const defaults = bitcoinConfig.config_currency_zcash.default as ZcashCoinConfig;

describe("config_currency_zcash default", () => {
  it.each([
    ["zaino.url", defaults.zaino.url],
    ["explorer.url", defaults.explorer.url],
  ])("points %s at production", (_field, url) => {
    const { protocol, hostname } = new URL(url);

    expect(protocol).toBe("https:");
    expect(hostname).not.toMatch(/ledger-test\.com$/);
  });

  it("carries the Ledger explorer id of the currency", () => {
    expect(defaults.explorerId).toBe("zec");
  });
});
