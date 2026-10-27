import { describe, expect, it } from "bun:test";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS } from "./live-common-setup";
import { walletCliConfig } from "./config";

describe("wallet CLI XRP setup", () => {
  it("registers XRP Mainnet and Testnet as supported currencies", () => {
    expect(WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS).toContain(
      CryptoCurrencyIdSchema.parse("ripple"),
    );
    expect(WALLET_CLI_SUPPORTED_CRYPTO_CURRENCY_IDS).toContain(
      CryptoCurrencyIdSchema.parse("ripple_testnet"),
    );
  });

  it("includes the XRP Mainnet and Testnet family configuration", () => {
    expect(walletCliConfig).toMatchObject({
      config_currency_ripple: {
        default: { name: "XRP", node: "https://xrp.coin.ledger.com" },
      },
      config_currency_ripple_testnet: {
        default: {
          name: "XRP (Testnet)",
          node: "https://s.altnet.rippletest.net:51234",
        },
      },
    });
  });
});
