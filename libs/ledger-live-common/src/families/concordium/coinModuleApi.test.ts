import { isNotSupportedStub } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { registerAllCoins } from "../../coin-modules/load-all-coins";
import { loadLocalApiForFamily, localApiServesAccountData } from "../../coin-modules/registry";
import { createLocalConcordiumApi } from "./coinModuleApi";

describe("createLocalConcordiumApi", () => {
  it("answers the account status only, leaving balance and operations to the legacy bridge", () => {
    const api = createLocalConcordiumApi("concordium");
    expect(api).toHaveProperty("getAccountStatus", expect.any(Function));
    expect(isNotSupportedStub(api.getBalance)).toBe(true);
    expect(isNotSupportedStub(api.listOperations)).toBe(true);
  });

  it("is the local api the concordium loader registers", async () => {
    registerAllCoins();
    expect(localApiServesAccountData(getCryptoCurrencyById("concordium"))).toBe(true);
    await expect(loadLocalApiForFamily("concordium")).resolves.toBe(createLocalConcordiumApi);
  });
});
