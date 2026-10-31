import { notSupported } from "@ledgerhq/coin-module-framework/api/index";
import { registerCoinModules, resetCoinModulesForTests } from "../../coin-modules/registry";
import type { CoinModuleLoader } from "../../coin-modules/types";
import { createCoinModuleHost } from "./createCoinModuleHost";

const getBalance = jest.fn();
const getTokenFromAsset = jest.fn();
const createLocalApi = jest.fn();
const balanceOptions = { includeAssets: async () => true };
const createBridgeApi = jest.fn(() => ({
  getTokenFromAsset,
  partitionsNativeBalance: true,
  balanceOptions,
}));

const loader = (family: string, overrides: Partial<CoinModuleLoader>): CoinModuleLoader => ({
  family,
  supportedCoins: [],
  accountDescriptorType: "address",
  loadSetup: async () => ({}),
  loadTransaction: () => Promise.reject(new Error("not read by the host")),
  ...overrides,
});

const loaders = [
  loader("evm", {
    supportedCoins: ["ethereum"],
    loadLocalApi: async () => createLocalApi,
    loadBridgeApi: async () => createBridgeApi,
  }),
  loader("bitcoin", {
    supportedCoins: ["bitcoin"],
    accountDescriptorType: "utxo",
    loadLocalApi: async () => createLocalApi,
  }),
  loader("polkadot", { supportedCoins: ["polkadot"] }),
];

const apiOf = async (currencyId: string) => {
  const api = await createCoinModuleHost().getApi(currencyId);
  if (!api) throw new Error(`No balance api for ${currencyId}`);
  return api;
};

beforeEach(() => {
  jest.clearAllMocks();
  createLocalApi.mockReturnValue({ getBalance });
  resetCoinModulesForTests();
  registerCoinModules(loaders);
});

afterAll(() => resetCoinModulesForTests());

describe("createCoinModuleHost", () => {
  describe("isCurrencySupported", () => {
    const { isCurrencySupported } = createCoinModuleHost();

    it("is true for a currency whose coin module ships a local api, utxo or not", () => {
      expect(isCurrencySupported("ethereum")).toBe(true);
      expect(isCurrencySupported("bitcoin")).toBe(true);
    });

    it("is false for a coin module without local api, a currency without coin module, and an unknown id", () => {
      expect(isCurrencySupported("polkadot")).toBe(false);
      expect(isCurrencySupported("solana")).toBe(false);
      expect(isCurrencySupported("not_a_currency")).toBe(false);
    });
  });

  it("reads no utxo account from its xpub", () => {
    expect(createCoinModuleHost().readsXpub).toBeUndefined();
  });

  describe("getApi", () => {
    it("reads the local coin module of the currency with its own context", async () => {
      getBalance.mockResolvedValueOnce([{ value: 1n, asset: { type: "native" } }]);

      const api = await apiOf("ethereum");
      await expect(api.getBalance("0xabc")).resolves.toEqual([
        { value: 1n, asset: { type: "native" } },
      ]);

      expect(createLocalApi).toHaveBeenCalledWith("ethereum");
      expect(getBalance).toHaveBeenCalledWith(
        expect.objectContaining({ config: expect.any(Function), logger: expect.any(Function) }),
        "0xabc",
        balanceOptions,
      );
    });

    it("resolves a token by the family's bridge api, and passes on what it says of its native balance", async () => {
      getTokenFromAsset.mockResolvedValueOnce({ id: "ethereum/erc20/usd_tether__erc20_" });
      getTokenFromAsset.mockResolvedValueOnce(undefined);

      const api = await apiOf("ethereum");

      await expect(api.getTokenId?.({ type: "erc20", assetReference: "0x1" })).resolves.toBe(
        "ethereum/erc20/usd_tether__erc20_",
      );
      await expect(
        api.getTokenId?.({ type: "erc20", assetReference: "0x2" }),
      ).resolves.toBeUndefined();
      expect(api.partitionsNativeBalance).toBe(true);
    });

    it("passes the family's balance options, and none for a family declaring none", async () => {
      await (await apiOf("ethereum")).getBalance("0xabc");
      await (await apiOf("bitcoin")).getBalance("xpub");

      expect(getBalance.mock.calls.map(([, subject, options]) => [subject, options])).toEqual([
        ["0xabc", balanceOptions],
        ["xpub", undefined],
      ]);
    });

    it("is undefined for a coin module whose getBalance is a not-supported stub", async () => {
      createLocalApi.mockReturnValueOnce({ getBalance: notSupported("getBalance") });

      await expect(createCoinModuleHost().getApi("ethereum")).resolves.toBeUndefined();
    });

    it("lists no token for a family without bridge api", async () => {
      const api = await apiOf("bitcoin");

      await expect(
        api.getTokenId?.({ type: "brc20", assetReference: "x" }),
      ).resolves.toBeUndefined();
      expect(api.partitionsNativeBalance).toBeUndefined();
    });
  });

  it("hands the blacklisted tokens of the app to the source", () => {
    const host = createCoinModuleHost({ blacklistedTokenIds: () => ["spam"] });

    expect(host.blacklistedTokenIds?.()).toEqual(["spam"]);
  });
});
