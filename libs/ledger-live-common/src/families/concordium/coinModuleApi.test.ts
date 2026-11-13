import { isNotSupportedStub } from "@ledgerhq/coin-module-framework/api/index";
import { createLocalConcordiumApi } from "./coinModuleApi";

describe("createLocalConcordiumApi", () => {
  it("answers the account status only, leaving balance and operations to the legacy bridge", () => {
    const api = createLocalConcordiumApi("concordium");
    expect(api).toHaveProperty("getAccountStatus", expect.any(Function));
    expect(isNotSupportedStub(api.getBalance)).toBe(true);
    expect(isNotSupportedStub(api.listOperations)).toBe(true);
  });
});
