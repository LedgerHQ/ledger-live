import { createApi } from "@ledgerhq/coin-filecoin/api";
import { createLocalFilecoinApi } from "./coinModuleApi";

describe("createLocalFilecoinApi", () => {
  it("returns coin-filecoin's API whatever the currency id", () => {
    const api = createLocalFilecoinApi("filecoin");

    expect(Object.keys(createLocalFilecoinApi("any-other-id")).sort()).toEqual(
      Object.keys(api).sort(),
    );
    expect(Object.keys(api).sort()).toEqual(Object.keys(createApi()).sort());
    expect(api).toMatchObject({
      getBalance: expect.any(Function),
      listOperations: expect.any(Function),
      lastBlock: expect.any(Function),
      estimateFees: expect.any(Function),
      validateIntent: expect.any(Function),
      craftTransaction: expect.any(Function),
      combine: expect.any(Function),
      broadcast: expect.any(Function),
      getNextSequence: expect.any(Function),
      validateAddress: expect.any(Function),
    });
  });
});
