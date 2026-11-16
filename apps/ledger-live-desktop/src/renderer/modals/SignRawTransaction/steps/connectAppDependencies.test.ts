import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getConnectAppDependencies } from "./connectAppDependencies";

describe("getConnectAppDependencies", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const bitcoinTestnet = getCryptoCurrencyById("bitcoin_testnet");
  const solana = getCryptoCurrencyById("solana");

  it("should require the account's app when no app is named", () => {
    expect(getConnectAppDependencies(bitcoin, undefined, undefined)).toEqual([
      { currency: bitcoin },
    ]);
  });

  it("should require the account's app when it is the app named", () => {
    expect(getConnectAppDependencies(bitcoin, "Bitcoin", undefined)).toEqual([
      { currency: bitcoin },
    ]);
  });

  it("should not require the account's app when an app allowed in its place is named", () => {
    expect(getConnectAppDependencies(bitcoin, "Hashi", undefined)).toEqual([]);
    expect(getConnectAppDependencies(bitcoinTestnet, "Hashi Test", undefined)).toEqual([]);
  });

  it("should require the account's app when the named app is not allowed for its currency", () => {
    expect(getConnectAppDependencies(bitcoin, "Hashi Test", undefined)).toEqual([
      { currency: bitcoin },
    ]);
    expect(getConnectAppDependencies(bitcoin, "Other", undefined)).toEqual([{ currency: bitcoin }]);
  });

  it("should require the account's app for another family naming another app", () => {
    expect(getConnectAppDependencies(solana, "Other", ["Exchange"])).toEqual([
      { currency: solana },
      { appName: "Exchange" },
    ]);
  });

  it("should keep the requested dependencies when an app allowed in its place is named", () => {
    expect(getConnectAppDependencies(bitcoin, "Hashi", ["Exchange"])).toEqual([
      { appName: "Exchange" },
    ]);
  });

  it("should add the requested dependencies after the account's app", () => {
    expect(getConnectAppDependencies(bitcoin, undefined, ["Exchange"])).toEqual([
      { currency: bitcoin },
      { appName: "Exchange" },
    ]);
  });

  it("should only keep the requested dependencies without an account", () => {
    expect(getConnectAppDependencies(undefined, undefined, ["Exchange"])).toEqual([
      { appName: "Exchange" },
    ]);
  });
});
