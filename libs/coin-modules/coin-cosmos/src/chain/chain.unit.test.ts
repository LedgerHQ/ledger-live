import cosmosCoinConfig, { cosmosDefaults, type CosmosCoinConfig } from "../config";
import { cosmosDefaultsFor } from "../test/cosmosDefaults";
import cryptoFactory from "./chain";

describe("cryptoFactory test", () => {
  beforeAll(() => {
    cosmosCoinConfig.setCoinConfig(cosmosDefaultsFor);
  });

  it("should not return null with currencies in cosmos family", () => {
    const currencies = [
      "cosmos",
      "osmosis",
      "osmo",
      "axelar",
      "binance_beacon_chain",
      "coreum",
      "desmos",
      "dydx",
      "nyx",
      "persistence",
      "secret_network",
      "stargaze",
      "stride",
      "mantra",
      "crypto_org",
      "xion",
      "babylon",
      "gonka",
    ];
    currencies.forEach(currency => {
      expect(cryptoFactory(currency)).not.toBeNull();
    });
  });

  it("should resolve the crypto_org_croeseid testnet to crypto_org chain params", () => {
    const chain = cryptoFactory("crypto_org_croeseid");
    expect(chain.prefix).toBe("cro");
    expect(chain.unbondingPeriod).toBe(28);
  });

  it("should apply an explicit config on every call instead of the cached chain params", () => {
    cryptoFactory("cosmos");
    const first = { lcd: "https://first.example", minGasPrice: 1 } as unknown as CosmosCoinConfig;
    const second = { lcd: "https://second.example", minGasPrice: 2 } as unknown as CosmosCoinConfig;

    expect(cryptoFactory("cosmos", first)).toMatchObject({
      lcd: "https://first.example",
      minGasPrice: 1,
    });
    expect(cryptoFactory("cosmos", second)).toMatchObject({
      lcd: "https://second.example",
      minGasPrice: 2,
    });
    expect(cryptoFactory("cosmos").lcd).not.toBe("https://second.example");
  });

  it("should resolve gonka with its parameters", () => {
    const chain = cryptoFactory("gonka");
    expect(chain.prefix).toBe("gonka");
    expect(chain.validatorPrefix).toBe("gonkavaloper");
    // The endpoint reaches the chain instance through config enrichment (chain/chain.ts).
    expect(chain.lcd).toBe("https://gonka.coin.ledger.com");
    // 1 ngonka per gas, the price of the chain's "cosmos" fee group.
    expect(chain.minGasPrice).toBe(1);
    expect(chain.ledgerValidator).toBeUndefined();
  });

  it("should keep gonka's configuration free of staking and of a Ledger validator", () => {
    const gonkaDefault = cosmosDefaults.gonka;
    expect(gonkaDefault).toMatchObject({
      disableDelegation: true,
      // The declared feature set is transfers only: staking must not appear here either.
      status: { features: [{ id: "blockchain_txs", status: "active" }] },
    });
    expect("ledgerValidator" in gonkaDefault).toBe(false);

    const featureIds = (
      (gonkaDefault.status as { features?: { id: string }[] }).features ?? []
    ).map(f => f.id);
    expect(featureIds).not.toContain("staking_txs");
  });

  it("should leave babylon's delegation enabled when no remote config disables it", () => {
    const babylonDefault = cosmosDefaults.babylon;
    expect("disableDelegation" in babylonDefault).toBe(false);
  });

  it("should opt crypto_org out of sending the prefix on the sign APDU", () => {
    // The only chains here not served by app-cosmos: coin type 394 runs the "Cronos POS Chain"
    // app, whose handling of the prefix field on signing is unverified.
    expect(cryptoFactory("crypto_org").signWithPrefix).toBe(false);
    expect(cryptoFactory("crypto_org_croeseid").signWithPrefix).toBe(false);
  });

  it("should send the prefix on the sign APDU for every app-cosmos chain", () => {
    for (const id of ["cosmos", "osmo", "dydx", "injective", "xion", "babylon", "gonka"]) {
      expect(cryptoFactory(id).signWithPrefix).toBe(true);
    }
  });

  it("should throw an error when currency id is unknown", () => {
    expect(() => cryptoFactory("unknown")).toThrow();
  });
});
