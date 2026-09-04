import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { loadBridgeExtensionsForFamily } from "../../coin-modules/registry";
import { defaultBridgeExtensions } from "../defaultBridgeExtensions";
import { getEnabledGenericCoinFrameworkFamilies } from "./genericCoinFrameworkFamilies";

// The swap quote path calls it before the user picks a recipient, and the default throws.
describe("estimation recipient of every generic-coin-framework family", () => {
  // hypercore has no send flow, so no recipient to estimate against.
  const families = getEnabledGenericCoinFrameworkFamilies().filter(f => f !== "hypercore");

  it.each(families)("%s names one without throwing", async family => {
    const extensions = await loadBridgeExtensionsForFamily(family);
    const getEstimationRecipient =
      extensions.getEstimationRecipient ?? defaultBridgeExtensions.getEstimationRecipient;
    const currencyId = family === "evm" ? "ethereum" : family === "xrp" ? "ripple" : family;
    const account = genAccount("estimation", { currency: getCryptoCurrencyById(currencyId) });

    expect(() => getEstimationRecipient(account)).not.toThrow();
    expect(getEstimationRecipient(account)).toBeTruthy();
  });
});
