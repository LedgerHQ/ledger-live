import { getAlpacaApi } from "./index";
import * as xrpModule from "@ledgerhq/coin-xrp/api/index";
import * as stellarModule from "@ledgerhq/coin-stellar/api/index";
import * as cantonModule from "@ledgerhq/coin-canton/api/index";
import * as tronModule from "@ledgerhq/coin-tron/api/index";
import * as config from "../../../config";
import * as networkApi from "./network/network-alpaca";
import * as cryptoAssets from "@ledgerhq/cryptoassets/currencies";

const mockApiInstance = { mock: "api" };

jest.mock("@ledgerhq/cryptoassets/currencies", () => ({
  getCryptoCurrencyById: jest.fn(),
}));

jest.mock("../../../config", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

jest.mock("@ledgerhq/coin-xrp/api/index", () => ({
  createApi: jest.fn(),
}));

jest.mock("@ledgerhq/coin-stellar/api/index", () => ({
  createApi: jest.fn(),
}));

jest.mock("@ledgerhq/coin-canton/api/index", () => ({
  createApi: jest.fn(),
}));

jest.mock("@ledgerhq/coin-tron/api/index", () => ({
  createApi: jest.fn(),
}));

jest.mock("./network/network-alpaca", () => ({
  getNetworkAlpacaApi: jest.fn(),
}));

describe("getAlpacaApi", () => {
  const mockCurrency = { id: "mock-currency" };

  beforeEach(() => {
    jest.clearAllMocks();

    // Common mocks
    (cryptoAssets.getCryptoCurrencyById as jest.Mock).mockReturnValue(mockCurrency);
    (config.getCurrencyConfiguration as jest.Mock).mockReturnValue({ config: true });

    // API mocks
    jest.spyOn(xrpModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(stellarModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(cantonModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(tronModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(networkApi, "getNetworkAlpacaApi").mockReturnValue(mockApiInstance as any);
  });

  const testCases = [
    { network: "xrp", module: xrpModule, label: "XRP" },
    { network: "stellar", module: stellarModule, label: "Stellar" },
    { network: "tron", module: tronModule, label: "Tron" },
    { network: "canton_network_devnet", module: cantonModule, label: "Canton devnet" },
    { network: "canton_network_localnet", module: cantonModule, label: "Canton localnet" },
    { network: "canton_network_mainnet", module: cantonModule, label: "Canton mainnet" },
  ];

  testCases.forEach(({ network, module, label }) => {
    it(`should return ${label} API for network "${network}" and kind "local"`, () => {
      const result = getAlpacaApi(network, "local");
      expect(result).toEqual(mockApiInstance);
      expect(module.createApi).toHaveBeenCalledWith({ config: true });
    });
  });

  it("should return network API for kind !== 'local'", () => {
    const result = getAlpacaApi("xrp", "remote");
    expect(networkApi.getNetworkAlpacaApi).toHaveBeenCalledWith("xrp");
    expect(result).toEqual(mockApiInstance);
  });
});
