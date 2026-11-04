import { createLocalTonApi } from "./coinModuleApi";

describe("createLocalTonApi", () => {
  it("returns coin-ton's API whatever the currency id", () => {
    const api = createLocalTonApi("ton");

    expect(Object.keys(createLocalTonApi("any-other-id")).sort()).toEqual(Object.keys(api).sort());
    expect(api).toMatchObject({
      getBalance: expect.any(Function),
      listOperations: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      combine: expect.any(Function),
      broadcast: expect.any(Function),
    });
  });
});
