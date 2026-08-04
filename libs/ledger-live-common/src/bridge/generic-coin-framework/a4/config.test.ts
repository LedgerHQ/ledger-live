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
      });
    });

    it.each([[null], ["string"], [42], [[]]])("returns off for malformed payload %j", payload => {
      mockGetValueByKey.mockReturnValue(payload);
      expect(resolveA4ChainConfig("ethereum")).toEqual({
        read: false,
        register: false,
        environment: "prd",
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
      });
    });

    it("returns off when chains field is missing", () => {
      mockGetValueByKey.mockReturnValue({ environment: "prd" });
      expect(resolveA4ChainConfig("ethereum")).toEqual({
        read: false,
        register: false,
        environment: "prd",
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
        expect(resolveA4ChainConfig("ethereum")).toEqual({ read, register, environment: "prd" });
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
      });
    });
  });
});

describe("a4Config", () => {
  it("registers config_generic_a4 as an object type with correct defaults", () => {
    expect(a4Config.config_generic_a4).toEqual({
      type: "object",
      default: {
        environment: "prd",
        chains: {
          adi: { enabled: false, registerOnly: true },
          arbitrum: { enabled: false, registerOnly: true },
          arc: { enabled: false, registerOnly: true },
          avalanche_c_chain: { enabled: false, registerOnly: true },
          avalanche_c_chain_fuji: { enabled: false, registerOnly: true },
          base: { enabled: false, registerOnly: true },
          berachain: { enabled: false, registerOnly: true },
          bitcoin: { enabled: false, registerOnly: true },
          bitcoin_cash: { enabled: false, registerOnly: true },
          bitcoin_gold: { enabled: false, registerOnly: true },
          bitcoin_testnet: { enabled: false, registerOnly: true },
          bitcoin_testnet4: { enabled: false, registerOnly: true },
          bitlayer: { enabled: false, registerOnly: true },
          bittorrent: { enabled: false, registerOnly: true },
          bsc: { enabled: false, registerOnly: true },
          canton_network: { enabled: false, registerOnly: true },
          canton_network_devnet: { enabled: false, registerOnly: true },
          canton_network_testnet: { enabled: false, registerOnly: true },
          cardano: { enabled: false, registerOnly: true },
          cardano_testnet: { enabled: false, registerOnly: true },
          dash: { enabled: false, registerOnly: true },
          digibyte: { enabled: false, registerOnly: true },
          dogecoin: { enabled: false, registerOnly: true },
          ethereum: { enabled: false, registerOnly: true },
          ethereum_classic: { enabled: false, registerOnly: true },
          ethereum_hoodi: { enabled: false, registerOnly: true },
          ethereum_sepolia: { enabled: false, registerOnly: true },
          fantom: { enabled: false, registerOnly: true },
          hedera: { enabled: false, registerOnly: true },
          hedera_testnet: { enabled: false, registerOnly: true },
          hyperevm: { enabled: false, registerOnly: true },
          linea: { enabled: false, registerOnly: true },
          linea_sepolia: { enabled: false, registerOnly: true },
          litecoin: { enabled: false, registerOnly: true },
          mantle: { enabled: false, registerOnly: true },
          mantle_sepolia: { enabled: false, registerOnly: true },
          monad: { enabled: false, registerOnly: true },
          monad_testnet: { enabled: false, registerOnly: true },
          optimism: { enabled: false, registerOnly: true },
          polygon: { enabled: false, registerOnly: true },
          ripple: { enabled: false, registerOnly: true },
          ripple_testnet: { enabled: false, registerOnly: true },
          robinhood: { enabled: false, registerOnly: true },
          rsk: { enabled: false, registerOnly: true },
          shape: { enabled: false, registerOnly: true },
          solana: { enabled: false, registerOnly: true },
          solana_devnet: { enabled: false, registerOnly: true },
          somnia: { enabled: false, registerOnly: true },
          sonic: { enabled: false, registerOnly: true },
          stellar: { enabled: false, registerOnly: true },
          stellar_testnet: { enabled: false, registerOnly: true },
          story: { enabled: false, registerOnly: true },
          sui: { enabled: false, registerOnly: true },
          tezos: { enabled: false, registerOnly: true },
          tezos_testnet: { enabled: false, registerOnly: true },
          tron: { enabled: false, registerOnly: true },
          tron_testnet: { enabled: false, registerOnly: true },
          zero_gravity: { enabled: false, registerOnly: true },
          zksync: { enabled: false, registerOnly: true },
        },
      },
    });
  });
});
