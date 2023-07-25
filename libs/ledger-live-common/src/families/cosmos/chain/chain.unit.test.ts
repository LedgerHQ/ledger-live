import cryptoFactory from "./chain";

describe("cryptoFactory test", () => {
  it("should not return null with currencies in cosmos family", () => {
    const currencies = [
      "cosmos",
      "osmosis",
      "osmo",
      "axelar",
      "binance_beacon_chain",
      "desmos",
      "nyx",
      "onomy",
      "persistence",
      "quicksilver",
      "secret_network",
      "sei_network",
      "stargaze",
      "stride",
    ];
    currencies.forEach(currency => {
      expect(cryptoFactory(currency)).not.toBeNull();
    });
  });

  it("should throw an error when currency id is unknown", () => {
    expect(() => cryptoFactory("unknown")).toThrow();
  });
});
