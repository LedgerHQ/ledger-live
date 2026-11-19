import { describe, expect, it } from "bun:test";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { listWalletCliSupportedCurrencyIds } from "./shared/supported-currencies";
import { walletCliConfig } from "./config";

describe("wallet CLI XRP setup", () => {
  it("registers XRP Mainnet and Testnet as supported currencies", () => {
    expect(listWalletCliSupportedCurrencyIds()).toContain(
      CryptoCurrencyIdSchema.parse("ripple"),
    );
    expect(listWalletCliSupportedCurrencyIds()).toContain(
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
