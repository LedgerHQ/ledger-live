import { UnknownNetworkError } from "./errors";
import { currencyIdFromNetwork, networkFromCurrencyId } from "./network";

describe("networkFromCurrencyId", () => {
  it.each([
    ["bitcoin", { name: "bitcoin", env: "main" }],
    ["ethereum", { name: "ethereum", env: "main" }],
    ["bitcoin_testnet", { name: "bitcoin", env: "testnet" }],
    ["solana_devnet", { name: "solana", env: "devnet" }],
    ["osmosis", { name: "osmo", env: "main" }],
    ["westend", { name: "westend", env: "main" }],
  ])("maps %s", (currencyId, network) => {
    expect(networkFromCurrencyId(currencyId)).toEqual(network);
  });

  it("throws on an unknown currency", () => {
    expect(() => networkFromCurrencyId("not_a_currency")).toThrow(UnknownNetworkError);
  });
});

describe("currencyIdFromNetwork", () => {
  it.each(["bitcoin", "ethereum", "bitcoin_testnet", "solana_devnet", "westend"])(
    "round-trips %s",
    id => {
      expect(currencyIdFromNetwork(networkFromCurrencyId(id))).toBe(id);
    },
  );

  it("ignores the case of the network", () => {
    expect(currencyIdFromNetwork({ name: "Bitcoin", env: "TESTNET" })).toBe("bitcoin_testnet");
  });

  it("throws on an unknown network", () => {
    expect(() => currencyIdFromNetwork({ name: "notachain", env: "main" })).toThrow(
      UnknownNetworkError,
    );
  });
});
