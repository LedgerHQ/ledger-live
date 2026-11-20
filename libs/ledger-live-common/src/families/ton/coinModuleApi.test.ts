import { createCoinModuleHost } from "../../account-data/coin-module/createCoinModuleHost";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../../coin-modules/registry";
import { createLocalTonApi } from "./coinModuleApi";

describe("createLocalTonApi", () => {
  it("returns coin-ton's API whatever the currency id", () => {
    const api = createLocalTonApi("ton");

    expect(Object.keys(createLocalTonApi("any-other-id")).sort()).toEqual(Object.keys(api).sort());
    expect(api).toMatchObject({
      getBalance: expect.any(Function),
      listOperations: expect.any(Function),
      getAccountStatus: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      combine: expect.any(Function),
      broadcast: expect.any(Function),
    });
  });
});

describe("TON account status in the account data layer", () => {
  beforeEach(() => {
    resetCoinModulesForTests();
    registerCoinModules(coinModuleLoaders.filter(({ family }) => family === "ton"));
  });
  afterAll(() => resetCoinModulesForTests());

  it("is read from coin-ton's getAccountStatus", async () => {
    await expect(createCoinModuleHost().getAccountStatusApi?.("ton")).resolves.toEqual({
      getAccountStatus: expect.any(Function),
    });
  });
});
