import coinConfig from "../config";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { createApi } from "./index";

describe("createApi", () => {
  const mockConfig = getMockedConfig("testnet");

  it("should set the coin config value", () => {
    const mockSetCoinConfig = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockConfig, "aleo");
    const config = coinConfig.getCoinConfig();

    expect(mockSetCoinConfig).toHaveBeenCalled();
    expect(config).toMatchObject({ status: { type: "active" } });
  });

  it("should return an API object with alpaca api methods", () => {
    const api = createApi(mockConfig, "aleo");

    expect(api.broadcast).toBeInstanceOf(Function);
    expect(api.combine).toBeInstanceOf(Function);
    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.estimateFees).toBeInstanceOf(Function);
    expect(api.getBalance).toBeInstanceOf(Function);
    expect(api.getBlock).toBeInstanceOf(Function);
    expect(api.getBlockInfo).toBeInstanceOf(Function);
    expect(api.lastBlock).toBeInstanceOf(Function);
    expect(api.listOperations).toBeInstanceOf(Function);
  });
});
