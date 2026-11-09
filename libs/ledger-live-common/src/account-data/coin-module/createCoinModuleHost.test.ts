import { AccountDataNotServedError } from "@domain/api-account-data";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setEnv } from "@shared/env";
import { notSupported } from "@ledgerhq/coin-module-framework/api/index";
import { getCurrencyConfiguration } from "../../config";
import { registerCoinModules, resetCoinModulesForTests } from "../../coin-modules/registry";
import type { CoinModuleLoader } from "../../coin-modules/types";
import { createCoinModuleHost } from "./createCoinModuleHost";

jest.mock("../../config", () => ({ getCurrencyConfiguration: jest.fn() }));

const getBalance = jest.fn();
const listOperations = jest.fn();
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

const createStakingBridgeApi = jest.fn(() => ({ usesStakingPositions: true }));

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
  loader("celo", {
    supportedCoins: ["celo"],
    loadLocalApi: async () => createLocalApi,
    loadBridgeApi: async () => createStakingBridgeApi,
  }),
  loader("polkadot", { supportedCoins: ["polkadot"] }),
];

const apiOf = async (currencyId: string) => {
  const api = await createCoinModuleHost().getApi(currencyId);
  if (!api) throw new Error(`No balance api for ${currencyId}`);
  return api;
};

const operationsApiOf = async (currencyId: string) => {
  const api = await createCoinModuleHost().getOperationsApi?.(currencyId);
  if (!api) throw new Error(`No operations api for ${currencyId}`);
  return api;
};

beforeEach(() => {
  jest.clearAllMocks();
  createLocalApi.mockReturnValue({ getBalance, listOperations });
  resetCoinModulesForTests();
  registerCoinModules(loaders);
});

afterEach(() => {
  setEnv("MOCK", "");
  jest.restoreAllMocks();
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

  it("supports no currency in mock mode, leaving mock accounts to FullSync and its mock bridges", () => {
    setEnv("MOCK", "1");

    expect(createCoinModuleHost().isCurrencySupported("ethereum")).toBe(false);
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

    it("is undefined for a family keeping its staked and locked funds in staking positions", async () => {
      await expect(createCoinModuleHost().getApi("celo")).resolves.toBeUndefined();
      expect(createLocalApi).not.toHaveBeenCalled();
    });

    it("is undefined for a coin module whose getBalance is a not-supported stub", async () => {
      createLocalApi.mockReturnValueOnce({ getBalance: notSupported("getBalance") });

      await expect(createCoinModuleHost().getApi("ethereum")).resolves.toBeUndefined();
    });

    it("has no token resolver for a family without bridge api, so its listed tokens are not served", async () => {
      const api = await apiOf("bitcoin");

      expect(api.getTokenId).toBeUndefined();
      expect(api.partitionsNativeBalance).toBeUndefined();
    });
  });

  describe("paginatesOperations", () => {
    const { paginatesOperations } = createCoinModuleHost({ servesOperations: true });

    it("is true for a family the generic bridge sends a page size, false for one taking no limit", () => {
      expect(paginatesOperations?.("ethereum")).toBe(true);
      expect(paginatesOperations?.("bitcoin")).toBe(false);
      expect(paginatesOperations?.("not_a_currency")).toBe(false);
    });

    it("serves no operations by default, leaving them to FullSync until pending operations are listed", () => {
      expect(createCoinModuleHost().paginatesOperations?.("ethereum")).toBe(false);
    });

    it("is decided in the code: a remote page size neither adds nor drops a family", () => {
      jest.spyOn(LiveConfig, "getValueByKey").mockReturnValue({
        networks: { bitcoin: { pageSize: 50 }, ethereum: { pageSize: "hostile" } },
      });

      expect(paginatesOperations?.("bitcoin")).toBe(false);
      expect(paginatesOperations?.("ethereum")).toBe(true);
    });
  });

  describe("getOperationsApi", () => {
    it("lists the operations newest first from the cursor, with the asked limit", async () => {
      const page = { items: [], next: "page-3" };
      listOperations.mockResolvedValueOnce(page);

      const api = await operationsApiOf("ethereum");

      await expect(api.listOperations("0xabc", { cursor: "page-2", limit: 20 })).resolves.toBe(
        page,
      );
      expect(listOperations).toHaveBeenCalledWith(
        expect.objectContaining({ config: expect.any(Function), logger: expect.any(Function) }),
        "0xabc",
        { minHeight: 0, cursor: "page-2", order: "desc", limit: 20 },
      );
    });

    it("sends the family's page size when no limit is asked, and never more", async () => {
      listOperations.mockResolvedValue({ items: [] });
      const api = await operationsApiOf("ethereum");

      await api.listOperations("0xabc", {});
      await api.listOperations("0xabc", { limit: 1_000 });

      expect(listOperations.mock.calls.map(([, , { limit }]) => limit)).toEqual([100, 100]);
    });

    it("takes the remote page size of the currency", async () => {
      jest
        .spyOn(LiveConfig, "getValueByKey")
        .mockReturnValue({ networks: { ethereum: { pageSize: 20 } } });
      listOperations.mockResolvedValue({ items: [] });

      await (await operationsApiOf("ethereum")).listOperations("0xabc", {});

      expect(listOperations.mock.calls[0][2]).toMatchObject({ limit: 20 });
    });

    it("resolves a token by the family's bridge api", async () => {
      getTokenFromAsset.mockResolvedValueOnce({ id: "ethereum/erc20/usd_tether__erc20_" });

      const api = await operationsApiOf("ethereum");

      await expect(api.getTokenId?.({ type: "erc20", assetReference: "0x1" })).resolves.toBe(
        "ethereum/erc20/usd_tether__erc20_",
      );
    });

    it("is undefined for a family taking no limit, without loading its coin module", async () => {
      await expect(createCoinModuleHost().getOperationsApi?.("bitcoin")).resolves.toBeUndefined();
      expect(createLocalApi).not.toHaveBeenCalled();
    });

    it("is undefined for a coin module whose listOperations is a not-supported stub", async () => {
      createLocalApi.mockReturnValueOnce({ listOperations: notSupported("listOperations") });

      await expect(createCoinModuleHost().getOperationsApi?.("ethereum")).resolves.toBeUndefined();
    });
  });

  describe("configuration", () => {
    const readConfig = async () => {
      getBalance.mockImplementationOnce(async context => {
        await context.config();
        return [];
      });
      return (await apiOf("ethereum")).getBalance("0xabc");
    };

    it("gives the coin module the configuration of its currency", async () => {
      jest.mocked(getCurrencyConfiguration).mockReturnValueOnce({
        status: { type: "active" },
        name: "Ethereum",
        unit: { name: "ETH", code: "ETH", magnitude: 18 },
      });

      await expect(readConfig()).resolves.toEqual([]);

      expect(getCurrencyConfiguration).toHaveBeenCalledWith("ethereum");
    });

    it("leaves a currency with no configuration to the next source", async () => {
      jest.mocked(getCurrencyConfiguration).mockImplementationOnce(() => {
        throw new Error("No currency configuration available for ethereum");
      });

      await expect(readConfig()).rejects.toBeInstanceOf(AccountDataNotServedError);
    });
  });

  it("hands the blacklisted tokens of the app to the source", () => {
    const host = createCoinModuleHost({ blacklistedTokenIds: () => ["spam"] });

    expect(host.blacklistedTokenIds?.()).toEqual(["spam"]);
  });
});

describe("getExistenceApi", () => {
  it("asks the coin module's exists with the currency context", async () => {
    const exists = jest.fn(async () => true);
    createLocalApi.mockReturnValue({ getBalance, exists });
    const api = await createCoinModuleHost().getExistenceApi?.("ethereum");
    await expect(api?.exists("0xabc")).resolves.toBe(true);
    expect(exists).toHaveBeenCalledWith(
      expect.objectContaining({ config: expect.any(Function) }),
      "0xabc",
    );
  });

  it("has none for a coin module without exists", async () => {
    await expect(createCoinModuleHost().getExistenceApi?.("ethereum")).resolves.toBeUndefined();
  });
});
