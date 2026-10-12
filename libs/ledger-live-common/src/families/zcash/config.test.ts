import type { ZcashCoinConfig } from "@ledgerhq/coin-zcash/config";
import { bitcoinConfig } from "../bitcoin/config";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { toWalletBtcCurrency } from "@ledgerhq/coin-bitcoin/walletBtcCurrency";
import { blockchainBaseURL } from "@ledgerhq/wallet-btc/explorer/baseUrl";

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

describe("config_currency_zcash_testnet default", () => {
  const testnet = bitcoinConfig.config_currency_zcash_testnet.default as ZcashCoinConfig;

  it("targets the Ledger testnet explorer and the public testnet Zaino", () => {
    expect(testnet.explorerId).toBe("zec_testnet");
    expect(testnet.explorer.url).toBe("https://explorers.api.live.ledger-test.com");
    expect(testnet.zaino.url).toBe("https://testnet.zec.rocks:443");
  });

  it("reaches no production Ledger host", () => {
    for (const url of [testnet.zaino.url, testnet.explorer.url]) {
      expect(new URL(url).hostname).not.toMatch(/(^|\.)ledger\.com$/);
    }
  });

  it("resolves the explorer base url of the zcash_testnet currency", () => {
    const currency = toWalletBtcCurrency(getCryptoCurrencyById("zcash_testnet"), testnet);

    expect(blockchainBaseURL(currency)).toBe(
      "https://explorers.api.live.ledger-test.com/blockchain/v4/zec_testnet",
    );
  });
});
