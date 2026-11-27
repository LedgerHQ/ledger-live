import { isNotSupportedStub } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { registerAllCoins } from "../../coin-modules/load-all-coins";
import { loadLocalApiForFamily, localApiServesAccountData } from "../../coin-modules/registry";
import { createLocalAleoApi } from "./coinModuleApi";

describe("createLocalAleoApi", () => {
  it("answers the account status only, leaving balance and operations to the legacy bridge", () => {
    const api = createLocalAleoApi("aleo");
    expect(api).toHaveProperty("getAccountStatus", expect.any(Function));
    expect(isNotSupportedStub(api.getAccountStatus)).toBe(false);
    expect(isNotSupportedStub(api.getBalance)).toBe(true);
    expect(isNotSupportedStub(api.listOperations)).toBe(true);
  });

  it("is the local api the aleo loader registers", async () => {
    registerAllCoins();
    expect(localApiServesAccountData(getCryptoCurrencyById("aleo"))).toBe(true);
    await expect(loadLocalApiForFamily("aleo")).resolves.toBe(createLocalAleoApi);
  });
});
