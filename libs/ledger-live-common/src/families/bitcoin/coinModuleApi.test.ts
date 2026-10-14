const createApi = jest.fn((..._args: unknown[]) => ({ api: true }));
jest.mock("@ledgerhq/coin-bitcoin/api", () => ({
  createApi: (...args: unknown[]) => createApi(...args),
}));

import { createLocalBitcoinApi } from "./coinModuleApi";

describe("createLocalBitcoinApi", () => {
  it("builds the coin module API of the currency, its config read from the context", () => {
    expect(createLocalBitcoinApi("bitcoin")).toEqual({ api: true });
    expect(createApi).toHaveBeenCalledWith("bitcoin");
  });
});
