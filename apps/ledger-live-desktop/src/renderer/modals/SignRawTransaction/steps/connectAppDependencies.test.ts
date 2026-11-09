import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getConnectAppDependencies } from "./connectAppDependencies";

describe("getConnectAppDependencies", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");

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

  it("should not require the account's app when another app is named", () => {
    expect(getConnectAppDependencies(bitcoin, "Hashi", undefined)).toEqual([]);
  });

  it("should keep the requested dependencies when another app is named", () => {
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
