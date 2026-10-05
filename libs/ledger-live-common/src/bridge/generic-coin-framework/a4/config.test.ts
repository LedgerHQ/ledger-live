import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { resolveA4ChainConfig, a4Config } from "./config";
import type { A4ChainEntry } from "./config";

jest.mock("@ledgerhq/live-config/LiveConfig", () => ({
  LiveConfig: {
    getValueByKey: jest.fn(),
  },
}));

const mockGetValueByKey = jest.mocked(LiveConfig.getValueByKey);

describe("resolveA4ChainConfig", () => {
  beforeEach(() => {
    mockGetValueByKey.mockReset();
  });

  describe("graceful degradation", () => {
    it("returns off when LiveConfig throws", () => {
      mockGetValueByKey.mockImplementation(() => {
        throw new Error("Config not set");
      });
      expect(resolveA4ChainConfig("ethereum")).toEqual({
        read: false,
        register: false,
        environment: "prd",
        maxDcRoamRetries: 5,
      });
    });

    it.each([[null], ["string"], [42], [[]]])("returns off for malformed payload %j", payload => {
      mockGetValueByKey.mockReturnValue(payload);
      expect(resolveA4ChainConfig("ethereum")).toEqual({
        read: false,
        register: false,
        environment: "prd",
        maxDcRoamRetries: 5,
      });
    });
  });

  describe("chain lookup", () => {
    it("returns off for a chain absent from the chains map", () => {
      mockGetValueByKey.mockReturnValue({ environment: "prd", chains: {} });
      expect(resolveA4ChainConfig("ethereum")).toEqual({
        read: false,
        register: false,
        environment: "prd",
        maxDcRoamRetries: 5,
      });
    });

    it("returns off when chains field is missing", () => {
      mockGetValueByKey.mockReturnValue({ environment: "prd" });
      expect(resolveA4ChainConfig("ethereum")).toEqual({
        read: false,
        register: false,
        environment: "prd",
        maxDcRoamRetries: 5,
      });
    });
  });

  describe("switch semantics", () => {
    it.each([
      [false, false, {}],
      [false, false, { enabled: false, registerOnly: false }],
      [false, true, { registerOnly: true }],
      [true, true, { enabled: true }],
      [false, true, { enabled: false, registerOnly: true }],
      [true, true, { enabled: true, registerOnly: true }],
      [true, true, { enabled: true, registerOnly: false }],
    ] satisfies [boolean, boolean, A4ChainEntry][])(
      "returns read:%s register:%s for entry %j",
      (read, register, entry) => {
        mockGetValueByKey.mockReturnValue({ environment: "prd", chains: { ethereum: entry } });
        expect(resolveA4ChainConfig("ethereum")).toEqual({
          read,
          register,
          environment: "prd",
          maxDcRoamRetries: 5,
        });
      },
    );
  });

  describe("environment resolution", () => {
    it.each([
      ["stg", "stg"],
      ["ppr", "ppr"],
      ["prd", "prd"],
      ["invalid", "prd"],
    ])("resolves global environment %s to %s", (raw, resolved) => {
      mockGetValueByKey.mockReturnValue({
        environment: raw,
        chains: { ethereum: { registerOnly: true } },
      });
      expect(resolveA4ChainConfig("ethereum")).toEqual({
        read: false,
        register: true,
        environment: resolved,
        maxDcRoamRetries: 5,
      });
    });

    it("per-chain environment overrides global", () => {
      mockGetValueByKey.mockReturnValue({
        environment: "stg",
        chains: { ethereum: { registerOnly: true, environment: "ppr" } },
      });
      expect(resolveA4ChainConfig("ethereum")).toEqual({
        read: false,
        register: true,
        environment: "ppr",
        maxDcRoamRetries: 5,
      });
    });

    it("falls back to prd on invalid per-chain environment", () => {
      mockGetValueByKey.mockReturnValue({
        environment: "stg",
        chains: { ethereum: { registerOnly: true, environment: "invalid" } },
      });
      expect(resolveA4ChainConfig("ethereum")).toEqual({
        read: false,
        register: true,
        environment: "prd",
        maxDcRoamRetries: 5,
      });
    });
  });

  describe("maxDcRoamRetries", () => {
    it("defaults to 5 when absent from the config", () => {
      mockGetValueByKey.mockReturnValue({
        environment: "prd",
        chains: { ethereum: { registerOnly: true } },
      });
      expect(resolveA4ChainConfig("ethereum").maxDcRoamRetries).toBe(5);
    });

    it("uses the explicit value from the config", () => {
      mockGetValueByKey.mockReturnValue({
        environment: "prd",
        maxDcRoamRetries: 3,
        chains: { ethereum: { registerOnly: true } },
      });
      expect(resolveA4ChainConfig("ethereum").maxDcRoamRetries).toBe(3);
    });

    it("falls back to 5 for a non-integer value without disabling the chain", () => {
      mockGetValueByKey.mockReturnValue({
        environment: "prd",
        maxDcRoamRetries: "many",
        chains: { ethereum: { registerOnly: true } },
      });
      const result = resolveA4ChainConfig("ethereum");
      expect(result.maxDcRoamRetries).toBe(5);
      expect(result.register).toBe(true);
    });
  });
});

describe("a4Config", () => {
  it("registers config_generic_a4 as an object type with correct defaults", () => {
    expect(a4Config.config_generic_a4).toEqual({
      type: "object",
      default: {
        environment: "prd",
        maxDcRoamRetries: 5,
        chains: {
          adi: { enabled: false, registerOnly: false },
          arbitrum: { enabled: false, registerOnly: false },
          arc: { enabled: false, registerOnly: false },
          avalanche_c_chain: { enabled: false, registerOnly: false },
          avalanche_c_chain_fuji: { enabled: false, registerOnly: false },
          base: { enabled: false, registerOnly: false },
          berachain: { enabled: false, registerOnly: false },
          bitcoin: { enabled: false, registerOnly: false },
          bitcoin_cash: { enabled: false, registerOnly: false },
          bitcoin_gold: { enabled: false, registerOnly: false },
          bitcoin_testnet: { enabled: false, registerOnly: false },
          bitcoin_testnet4: { enabled: false, registerOnly: false },
          bitlayer: { enabled: false, registerOnly: false },
          bittorrent: { enabled: false, registerOnly: false },
          bsc: { enabled: false, registerOnly: false },
          canton_network: { enabled: false, registerOnly: false },
          canton_network_devnet: { enabled: false, registerOnly: false },
          canton_network_testnet: { enabled: false, registerOnly: false },
          cardano: { enabled: false, registerOnly: false },
          cardano_testnet: { enabled: false, registerOnly: false },
          dash: { enabled: false, registerOnly: false },
          digibyte: { enabled: false, registerOnly: false },
          dogecoin: { enabled: false, registerOnly: false },
          ethereum: { enabled: false, registerOnly: false },
          ethereum_classic: { enabled: false, registerOnly: false },
          ethereum_hoodi: { enabled: false, registerOnly: false },
          ethereum_sepolia: { enabled: false, registerOnly: false },
          fantom: { enabled: false, registerOnly: false },
          hedera: { enabled: false, registerOnly: false },
          hedera_testnet: { enabled: false, registerOnly: false },
          hyperevm: { enabled: false, registerOnly: false },
          linea: { enabled: false, registerOnly: false },
          linea_sepolia: { enabled: false, registerOnly: false },
          litecoin: { enabled: false, registerOnly: false },
          mantle: { enabled: false, registerOnly: false },
          mantle_sepolia: { enabled: false, registerOnly: false },
          monad: { enabled: false, registerOnly: false },
          monad_testnet: { enabled: false, registerOnly: false },
          optimism: { enabled: false, registerOnly: false },
          polygon: { enabled: false, registerOnly: false },
          ripple: { enabled: false, registerOnly: false },
          ripple_testnet: { enabled: false, registerOnly: false },
          robinhood: { enabled: false, registerOnly: false },
          rsk: { enabled: false, registerOnly: false },
          shape: { enabled: false, registerOnly: false },
          solana: { enabled: false, registerOnly: false },
          solana_devnet: { enabled: false, registerOnly: false },
          somnia: { enabled: false, registerOnly: false },
          sonic: { enabled: false, registerOnly: false },
          stellar: { enabled: false, registerOnly: false },
          stellar_testnet: { enabled: false, registerOnly: false },
          story: { enabled: false, registerOnly: false },
          sui: { enabled: false, registerOnly: false },
          tezos: { enabled: false, registerOnly: false },
          tezos_testnet: { enabled: false, registerOnly: false },
          tron: { enabled: false, registerOnly: false },
          tron_testnet: { enabled: false, registerOnly: false },
          zero_gravity: { enabled: false, registerOnly: false },
          zksync: { enabled: false, registerOnly: false },
        },
      },
    });
  });
});
