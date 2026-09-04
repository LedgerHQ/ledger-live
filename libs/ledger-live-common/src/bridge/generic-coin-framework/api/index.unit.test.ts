import { getCoinModuleApi } from "./index";
import { coinModuleLoaders } from "../../../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../../../coin-modules/registry";
import * as xrpModule from "@ledgerhq/coin-xrp/api/index";
import * as stellarModule from "@ledgerhq/coin-stellar/api/index";
import * as cantonModule from "@ledgerhq/coin-canton/api/index";
import * as tronModule from "@ledgerhq/coin-tron/api/index";
import * as evmModule from "@ledgerhq/coin-evm/api/index";
import * as cardanoModule from "@ledgerhq/coin-cardano/api/index";
import * as config from "../../../config";
import * as networkApi from "./network/network-coin-service";
import * as cryptoAssets from "@domain/entity-currency-crypto";

const mockApiInstance = { mock: "api" };

// The resolver hands out the module through withDefaults + withLogging, so the returned value is no
// longer the module object itself: capabilities it does not implement are backfilled and a
// `supports` helper is attached. What must still hold is that the module's own members come through
// untouched.
// `supports` is deliberately absent from the resolver's declared return type — the contract stays
// `CoinModuleApi & BridgeApi` — so the assertions go through a loose view, as elsewhere in this file.
const expectResolvedModule = (result: any) => {
  expect(result.mock).toBe("api");
  expect(typeof result.supports).toBe("function");
  expect(result.supports("getStakes")).toBe(false);
};

jest.mock("@domain/entity-currency-crypto", () => ({
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

jest.mock("@ledgerhq/coin-cardano/api/index", () => ({
  createApi: jest.fn(),
}));

jest.mock("./network/network-coin-service", () => ({
  getNetworkCoinModuleApi: jest.fn(),
}));

describe("getCoinModuleApi", () => {
  beforeAll(() => registerCoinModules(coinModuleLoaders));
  afterAll(() => resetCoinModulesForTests());

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
        case "cardano":
          return { id: "cardano", family: "cardano" };
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
    jest.spyOn(cardanoModule, "createApi").mockReturnValue(mockApiInstance as any);
    jest.spyOn(networkApi, "getNetworkCoinModuleApi").mockReturnValue(mockApiInstance as any);
  });

  // Config-first (framework v6): the local adapter calls createApi() with no config; families that
  // need the currency id (evm, cardano) forward it, the rest take no arguments.
  const testCases = [
    { network: "xrp", module: xrpModule, label: "XRP", params: [] as unknown[] },
    { network: "tron", module: tronModule, label: "Tron", params: [] as unknown[] },
    { network: "canton", module: cantonModule, label: "Canton", params: [] as unknown[] },
    {
      network: "ethereum",
      module: evmModule,
      label: "Ethereum",
      params: ["ethereum"] as unknown[],
    },
    { network: "sonic", module: evmModule, label: "Sonic", params: ["sonic"] as unknown[] },
    {
      network: "cardano",
      module: cardanoModule,
      label: "Cardano",
      params: ["cardano"] as unknown[],
    },
  ];

  testCases.forEach(({ network, module, label, params }) => {
    it(`should return ${label} API for network "${network}" and kind "local"`, async () => {
      const result = await getCoinModuleApi(network, "local");
      expectResolvedModule(result);
      expect(module.createApi).toHaveBeenCalledWith(...params);
    });
  });

  // Stellar wraps its local api to translate the framework memo union onto coin-stellar's flat
  // memo shape (LIVE-35735), so it does not pass the base api through verbatim like the others.
  it('should return a memo-adapting Stellar API for network "stellar" and kind "local"', async () => {
    const result = await getCoinModuleApi("stellar", "local");
    expect(stellarModule.createApi).toHaveBeenCalledWith();
    expect(result).toMatchObject(mockApiInstance);
    expect(typeof (result as { craftTransaction: unknown }).craftTransaction).toBe("function");
    expect(typeof (result as { validateIntent: unknown }).validateIntent).toBe("function");
  });

  it("should return network API for kind !== 'local'", async () => {
    const result = await getCoinModuleApi("xrp", "remote");
    expect(networkApi.getNetworkCoinModuleApi).toHaveBeenCalledWith("xrp");
    expectResolvedModule(result);
  });

  it("backfills a capability the module does not implement", async () => {
    const result = await getCoinModuleApi("xrp", "local");
    // The module above implements nothing, so every capability comes from the framework default
    // and reports itself as unsupported rather than being missing.
    expect(() => result.getStakes({} as any, "addr")).toThrow("getStakes is not supported");
  });

  it("logs each call made through the resolver", async () => {
    const logger = jest.fn();
    const lastBlock = jest.fn().mockResolvedValue({ height: 1 });
    jest.spyOn(xrpModule, "createApi").mockReturnValue({ ...mockApiInstance, lastBlock } as any);

    const result = await getCoinModuleApi("xrp", "local");
    await result.lastBlock({ logger } as any);

    expect(lastBlock).toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith("[coin-module] lastBlock: call");
    expect(logger).toHaveBeenCalledWith("[coin-module] lastBlock: ok");
  });
});
