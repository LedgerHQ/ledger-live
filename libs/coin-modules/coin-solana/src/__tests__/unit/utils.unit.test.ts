import type { SolanaCoinConfig } from "../../config";
import { coinConfigFixture, INFRA_FIXTURE } from "../../test/coinConfig.fixture";
import {
  endpointByCurrencyId,
  LEDGER_VALIDATOR_BY_FIGMENT,
  LEDGER_VALIDATOR_BY_BITWISE,
  LEDGER_VALIDATOR_DEFAULT,
} from "../../utils";

const configWithRpcUrls = (rpcUrls?: SolanaCoinConfig["rpcUrls"]): SolanaCoinConfig =>
  coinConfigFixture(rpcUrls ? { rpcUrls } : {});

describe("utils - endpointByCurrencyId", () => {
  describe("when coin config has no rpcUrls", () => {
    const config = configWithRpcUrls(undefined);

    it.each(["solana", "solana_devnet", "solana_testnet"])(
      "falls back to the currency's infra proxy for %s",
      currencyId => {
        expect(endpointByCurrencyId(config, currencyId)).toBe(INFRA_FIXTURE.API_SOLANA_PROXY);
      },
    );
  });

  describe("when coin config provides rpcUrls", () => {
    const config = configWithRpcUrls({
      solana: "https://custom-mainnet.example.com",
      solana_devnet: "https://custom-devnet.example.com",
      solana_testnet: "https://custom-testnet.example.com",
    });

    it("uses the configured mainnet URL", () => {
      expect(endpointByCurrencyId(config, "solana")).toBe("https://custom-mainnet.example.com");
    });

    it("uses the configured devnet URL", () => {
      expect(endpointByCurrencyId(config, "solana_devnet")).toBe(
        "https://custom-devnet.example.com",
      );
    });

    it("uses the configured testnet URL", () => {
      expect(endpointByCurrencyId(config, "solana_testnet")).toBe(
        "https://custom-testnet.example.com",
      );
    });
  });

  it("throws for unknown currency ids", () => {
    expect(() => endpointByCurrencyId(configWithRpcUrls(undefined), "solana_unknown")).toThrow(
      /unexpected currency id format/,
    );
  });
});

describe("utils - Default Validators", () => {
  it("should have APY property", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT).toMatchObject({ apy: expect.any(Number) });
    expect(LEDGER_VALIDATOR_BY_BITWISE).toMatchObject({ apy: expect.any(Number) });
  });
  it("should have different APY values", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT.apy).not.toBe(LEDGER_VALIDATOR_BY_BITWISE.apy);
  });

  it("should reference correct default", () => {
    expect(LEDGER_VALIDATOR_DEFAULT).toBe(LEDGER_VALIDATOR_BY_FIGMENT);
  });
});
