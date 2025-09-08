import { createApi } from "./index";
import coinConfig, { HederaConfig } from "../config";

const testHederaConfig: HederaConfig = {
  network: "testnet",
};

describe("createApi", () => {
  it("should set the coin config value", () => {
    const mockSetCoinConfig = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(testHederaConfig);
    const config = coinConfig.getCoinConfig();

    expect(mockSetCoinConfig).toHaveBeenCalled();
    expect(config).toMatchObject({
      ...testHederaConfig,
      status: { type: "active" },
    });
  });

  it("should return an API object with alpaca api methods", () => {
    const api = createApi(testHederaConfig);

    expect(api.broadcast).toBeInstanceOf(Function);
    expect(api.combine).toBeInstanceOf(Function);
    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.estimateFees).toBeInstanceOf(Function);
    expect(api.getBalance).toBeInstanceOf(Function);
    expect(api.lastBlock).toBeInstanceOf(Function);
    expect(api.listOperations).toBeInstanceOf(Function);
    expect(api.getAssetFromToken).toBeInstanceOf(Function);
    expect(api.getTokenFromAsset).toBeInstanceOf(Function);
  });
});
