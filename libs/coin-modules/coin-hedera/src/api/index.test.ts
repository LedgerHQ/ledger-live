import coinConfig from "../config";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { createApi } from "./index";

describe("createApi", () => {
  const mockConfig = getMockedConfig();
  const mockCurrency = getMockedCurrency();

  it("should set the coin config value", () => {
    const mockSetCoinConfig = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockConfig, mockCurrency.id);
    const config = coinConfig.getCoinConfig(mockCurrency);

    expect(mockSetCoinConfig).toHaveBeenCalled();
    expect(config).toMatchObject({
      status: { type: "active" },
    });
  });

  it("should return an API object with alpaca api methods", () => {
    const api = createApi(mockConfig, mockCurrency.id);

    expect(api.broadcast).toBeInstanceOf(Function);
    expect(api.combine).toBeInstanceOf(Function);
    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.estimateFees).toBeInstanceOf(Function);
    expect(api.getAssetFromToken).toBeInstanceOf(Function);
    expect(api.getBalance).toBeInstanceOf(Function);
    expect(api.getBlock).toBeInstanceOf(Function);
    expect(api.getBlockInfo).toBeInstanceOf(Function);
    expect(api.getTokenFromAsset).toBeInstanceOf(Function);
    expect(api.getValidators).toBeInstanceOf(Function);
    expect(api.getStakes).toBeInstanceOf(Function);
    expect(api.getRewards).toBeInstanceOf(Function);
    expect(api.lastBlock).toBeInstanceOf(Function);
    expect(api.listOperations).toBeInstanceOf(Function);
  });
});
