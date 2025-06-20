import * as SuiModule from "./index";

describe("src/index barrel file", () => {
  it("should export createBridges as a function", () => {
    expect(typeof SuiModule.createBridges).toBe("function");
  });
});
