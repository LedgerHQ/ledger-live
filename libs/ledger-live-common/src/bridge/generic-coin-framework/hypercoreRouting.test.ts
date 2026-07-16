import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import { createTransaction } from "./createTransaction";
import {
  getEnabledGenericCoinFrameworkFamilies,
  isGenericCoinFrameworkFamily,
} from "./genericCoinFrameworkFamilies";

describe("hypercore generic coin framework routing", () => {
  it("routes the hypercore family through the generic coin framework", () => {
    expect(isGenericCoinFrameworkFamily("hypercore")).toBe(true);
    expect(getEnabledGenericCoinFrameworkFamilies()).toContain("hypercore");
  });

  it("resolves the hypercore currency with an EVM-compatible coin type", () => {
    const currency = getCryptoCurrencyById("hypercore");
    expect(currency.family).toBe("hypercore");
    expect(currency.coinType).toBe(60);
    expect(currency.units[0].magnitude).toBe(6);
  });

  it("registers a coin-module loader that reuses the EVM signer", () => {
    const loader = coinModuleLoaders.find(l => l.family === "hypercore");
    expect(loader).toBeDefined();
    expect(loader?.supportedCoins).toEqual(["hypercore"]);
    expect(loader?.loadLocalApi).toBeDefined();
    expect(loader?.loadSigner).toBeDefined();
    expect(loader?.loadTransaction).toBeDefined();
  });

  it("builds a minimal default transaction (no send flow)", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("hypercore"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "hypercore",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      mode: "send",
    });
  });
});
