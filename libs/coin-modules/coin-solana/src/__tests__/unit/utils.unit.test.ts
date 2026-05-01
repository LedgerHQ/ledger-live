import { clusterApiUrl } from "@solana/web3.js";
import { getEnv } from "@ledgerhq/live-env";
import coinConfig from "../../config";
import {
  endpointByCurrencyId,
  LEDGER_VALIDATOR_BY_FIGMENT,
  LEDGER_VALIDATOR_BY_CHORUS_ONE,
  LEDGER_VALIDATOR_DEFAULT,
} from "../../utils";

jest.mock("../../config", () => ({
  __esModule: true,
  default: { getCoinConfig: jest.fn(), setCoinConfig: jest.fn() },
}));

jest.mock("@ledgerhq/live-env", () => ({ getEnv: jest.fn() }));

const mockGetCoinConfig = coinConfig.getCoinConfig as jest.Mock;
const mockGetEnv = getEnv as jest.Mock;

describe("utils - endpointByCurrencyId", () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue("https://proxy.solana.example.com");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("when coin config is not initialised", () => {
    beforeEach(() => {
      mockGetCoinConfig.mockImplementation(() => {
        throw new Error("MissingCoinConfig");
      });
    });

    it("falls back to API_SOLANA_PROXY for solana", () => {
      expect(endpointByCurrencyId("solana")).toBe("https://proxy.solana.example.com");
    });

    it("falls back to clusterApiUrl for solana_devnet", () => {
      expect(endpointByCurrencyId("solana_devnet")).toBe(clusterApiUrl("devnet"));
    });

    it("falls back to clusterApiUrl for solana_testnet", () => {
      expect(endpointByCurrencyId("solana_testnet")).toBe(clusterApiUrl("testnet"));
    });
  });

  describe("when coin config has no rpcUrls", () => {
    beforeEach(() => {
      mockGetCoinConfig.mockReturnValue({ token2022Enabled: false, legacyOCMSMaxVersion: "1.0.0" });
    });

    it("falls back to API_SOLANA_PROXY for solana", () => {
      expect(endpointByCurrencyId("solana")).toBe("https://proxy.solana.example.com");
    });

    it("falls back to clusterApiUrl for solana_devnet", () => {
      expect(endpointByCurrencyId("solana_devnet")).toBe(clusterApiUrl("devnet"));
    });

    it("falls back to clusterApiUrl for solana_testnet", () => {
      expect(endpointByCurrencyId("solana_testnet")).toBe(clusterApiUrl("testnet"));
    });
  });

  describe("when coin config provides rpcUrls", () => {
    beforeEach(() => {
      mockGetCoinConfig.mockReturnValue({
        token2022Enabled: false,
        legacyOCMSMaxVersion: "1.0.0",
        rpcUrls: {
          solana: "https://custom-mainnet.example.com",
          solana_devnet: "https://custom-devnet.example.com",
          solana_testnet: "https://custom-testnet.example.com",
        },
      });
    });

    it("uses the configured mainnet URL", () => {
      expect(endpointByCurrencyId("solana")).toBe("https://custom-mainnet.example.com");
    });

    it("uses the configured devnet URL", () => {
      expect(endpointByCurrencyId("solana_devnet")).toBe("https://custom-devnet.example.com");
    });

    it("uses the configured testnet URL", () => {
      expect(endpointByCurrencyId("solana_testnet")).toBe("https://custom-testnet.example.com");
    });
  });

  it("throws for unknown currency ids", () => {
    mockGetCoinConfig.mockReturnValue({});
    expect(() => endpointByCurrencyId("solana_unknown")).toThrow(/unexpected currency id format/);
  });
});

describe("utils - Default Validators", () => {
  it("should have APY property", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT).toMatchObject({ apy: expect.any(Number) });
    expect(LEDGER_VALIDATOR_BY_CHORUS_ONE).toMatchObject({ apy: expect.any(Number) });
  });
  it("should have different APY values", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT.apy).not.toBe(LEDGER_VALIDATOR_BY_CHORUS_ONE.apy);
  });

  it("should reference correct default", () => {
    expect(LEDGER_VALIDATOR_DEFAULT).toBe(LEDGER_VALIDATOR_BY_FIGMENT);
  });
});
