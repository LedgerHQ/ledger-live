import { isNotSupportedStub } from "@ledgerhq/coin-module-framework/api/index";
import { createLocalCantonApi } from "./coinModuleApi";

describe("createLocalCantonApi", () => {
  it("answers the account status next to the balance and operations it already serves", () => {
    const api = createLocalCantonApi("canton_network");
    expect(api).toHaveProperty("getAccountStatus", expect.any(Function));
    expect("getAccountStatus" in api && isNotSupportedStub(api.getAccountStatus)).toBe(false);
    expect(isNotSupportedStub(api.getBalance)).toBe(false);
    expect(isNotSupportedStub(api.listOperations)).toBe(false);
  });
});
