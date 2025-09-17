import { getAlpacaApi } from "./index";
import * as xrpModule from "@ledgerhq/coin-xrp/api/index";
import * as stellarModule from "@ledgerhq/coin-stellar/api/index";
import * as cantonModule from "@ledgerhq/coin-canton/api/index";
import * as tronModule from "@ledgerhq/coin-tron/api/index";
import * as evmModule from "@ledgerhq/coin-evm/api/index";
import * as config from "../../../config";
import * as networkApi from "./network/network-alpaca";
import * as cryptoAssets from "@ledgerhq/cryptoassets/currencies";

const mockApiInstance = { mock: "api" };

jest.mock("@ledgerhq/cryptoassets/currencies", () => ({
  findCryptoCurrencyById: jest.fn(),
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

jest.mock("@ledgerhq/coin-evm/api/index", () => ({
  createApi: jest.fn(),
}));

jest.mock("./network/network-alpaca", () => ({
  getNetworkAlpacaApi: jest.fn(),
}));

describe("getAlpacaApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Common mocks
    (cryptoAssets.findCryptoCurrencyById as jest.Mock).mockImplementation(id => {
      switch (id) {
        case "ripple":
          return { family: "xrp" };
        case "stellar":
          return { family: "stellar" };
        case "canton":
          return { family: "canton" };
        case "tron":
          return { family: "tron" };
        case "ethereum":
          return { id: "ethereum", family: "evm" };
        case "sonic":
          return { id: "sonic", family: "evm" };
        default:
          return undefined;
      }
    });
    (config.getCurrencyConfiguration as jest.Mock).mockReturnValue({ config: true });

    // API mocks
    jest.spyOn(xrpModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(stellarModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(cantonModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(tronModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(evmModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(networkApi, "getNetworkAlpacaApi").mockReturnValue(mockApiInstance as any);
  });

  const testCases = [
    { network: "xrp", module: xrpModule, label: "XRP", params: [{ config: true }] },
    { network: "stellar", module: stellarModule, label: "Stellar", params: [{ config: true }] },
    { network: "tron", module: tronModule, label: "Tron", params: [{ config: true }] },
    { network: "canton", module: cantonModule, label: "Canton", params: [{ config: true }] },
    {
      network: "ethereum",
      module: evmModule,
      label: "Ethereum",
      params: [{ config: true }, "ethereum"],
    },
    { network: "sonic", module: evmModule, label: "Sonic", params: [{ config: true }, "sonic"] },
  ];

  testCases.forEach(({ network, module, label, params }) => {
    it(`should return ${label} API for network "${network}" and kind "local"`, () => {
      const result = getAlpacaApi(network, "local");
      expect(result).toEqual(mockApiInstance);
      expect(module.createApi).toHaveBeenCalledWith(...params);
    });
  });

  it("should return network API for kind !== 'local'", () => {
    const result = getAlpacaApi("xrp", "remote");
    expect(networkApi.getNetworkAlpacaApi).toHaveBeenCalledWith("xrp");
    expect(result).toEqual(mockApiInstance);
  });
});
