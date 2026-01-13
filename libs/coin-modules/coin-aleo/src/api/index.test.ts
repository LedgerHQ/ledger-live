import coinConfig from "../config";
import { createApi } from "./index";

describe("createApi", () => {
  it("should set the coin config value", () => {
    const mockSetCoinConfig = jest.spyOn(coinConfig, "setCoinConfig");

    createApi({ nodeUrl: "" }, "aleo");
    const config = coinConfig.getCoinConfig();

    expect(mockSetCoinConfig).toHaveBeenCalled();
    expect(config).toMatchObject({ status: { type: "active" } });
  });

  it("should return an API object with alpaca api methods", () => {
    const api = createApi({ nodeUrl: "" }, "aleo");

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
