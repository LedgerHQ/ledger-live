import type { Api } from "@ledgerhq/coin-framework/api/types";
import type { AptosAsset } from "../../types/assets";
import type { AptosConfig } from "../../config";
import { createApi } from "../../api";
import coinConfig from "../../config";

jest.mock("../../config", () => ({
  setCoinConfig: jest.fn(),
}));

jest.mock("../../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
  estimateFees: jest.fn(),
  getBalance: jest.fn(),
  listOperations: jest.fn(),
  lastBlock: jest.fn(),
}));

describe("createApi", () => {
  const mockAptosConfig: AptosConfig = {} as AptosConfig;

  it("should set the coin config value", () => {
    const setCoinConfigSpy = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockAptosConfig);

    const config = setCoinConfigSpy.mock.calls[0][0]();

    expect(setCoinConfigSpy).toHaveBeenCalled();

    expect(config).toEqual(
      expect.objectContaining({
        ...mockAptosConfig,
        status: { type: "active" },
      }),
    );
  });

  it("should return an API object with alpaca api methods", () => {
    const api: Api<AptosAsset> = createApi(mockAptosConfig);

    // Check that methods are set with what we expect
    expect(api.broadcast).toBeDefined();
    expect(api.combine).toBeDefined();
    expect(api.craftTransaction).toBeDefined();
    expect(api.estimateFees).toBeDefined();
    expect(api.getBalance).toBeDefined();
    expect(api.lastBlock).toBeDefined();
    expect(api.listOperations).toBeDefined();
  });
});
