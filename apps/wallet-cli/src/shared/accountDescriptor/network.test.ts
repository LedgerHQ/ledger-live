import { describe, expect, it } from "bun:test";
import {
  parseNetworkArg,
  serializeNetwork,
  networkFromCurrencyId,
  currencyIdFromNetwork,
  UnknownNetworkError,
} from "./network";

describe("parseNetworkArg", () => {
  it("bare name defaults to main env", () => {
    expect(parseNetworkArg("bitcoin")).toEqual({ name: "bitcoin", env: "main" });
  });

  it("lowercases the name", () => {
    expect(parseNetworkArg("Ethereum")).toEqual({ name: "ethereum", env: "main" });
  });

  it("normalizes 'mainnet' alias to 'main'", () => {
    expect(parseNetworkArg("ethereum:mainnet")).toEqual({ name: "ethereum", env: "main" });
  });

  it("explicit 'main' env stays as main", () => {
    expect(parseNetworkArg("bitcoin:main")).toEqual({ name: "bitcoin", env: "main" });
  });

  it("parses testnet env", () => {
    expect(parseNetworkArg("bitcoin:testnet")).toEqual({ name: "bitcoin", env: "testnet" });
  });

  it("parses devnet env", () => {
    expect(parseNetworkArg("solana:devnet")).toEqual({ name: "solana", env: "devnet" });
  });

  it("parses named testnet (goerli)", () => {
    expect(parseNetworkArg("ethereum:goerli")).toEqual({ name: "ethereum", env: "goerli" });
  });

  it("lowercases the env alias", () => {
    expect(parseNetworkArg("ethereum:MAINNET")).toEqual({ name: "ethereum", env: "main" });
  });
});

describe("serializeNetwork", () => {
  it("serializes mainnet", () => {
    expect(serializeNetwork({ name: "bitcoin", env: "main" })).toBe("bitcoin:main");
  });

  it("serializes testnet", () => {
    expect(serializeNetwork({ name: "bitcoin", env: "testnet" })).toBe("bitcoin:testnet");
  });

  it("round-trips with parseNetworkArg", () => {
    const net = parseNetworkArg("ethereum:goerli");
    expect(serializeNetwork(net)).toBe("ethereum:goerli");
  });
});

describe("networkFromCurrencyId", () => {
  it("maps bitcoin to main env", () => {
    expect(networkFromCurrencyId("bitcoin")).toEqual({ name: "bitcoin", env: "main" });
  });

  it("maps ethereum to main env", () => {
    expect(networkFromCurrencyId("ethereum")).toEqual({ name: "ethereum", env: "main" });
  });

  it("maps bitcoin_testnet to testnet env", () => {
    expect(networkFromCurrencyId("bitcoin_testnet")).toEqual({
      name: "bitcoin",
      env: "testnet",
    });
  });

  it("maps solana_devnet to devnet env", () => {
    expect(networkFromCurrencyId("solana_devnet")).toEqual({
      name: "solana",
      env: "devnet",
    });
  });

  it("throws UnknownNetworkError for unknown currency", () => {
    expect(() => networkFromCurrencyId("not_a_currency")).toThrow(UnknownNetworkError);
  });
});

describe("currencyIdFromNetwork", () => {
  it("returns the name for mainnet", () => {
    expect(currencyIdFromNetwork({ name: "bitcoin", env: "main" })).toBe("bitcoin");
  });

  it("returns name_env for testnet", () => {
    expect(currencyIdFromNetwork({ name: "bitcoin", env: "testnet" })).toBe("bitcoin_testnet");
  });

  it("returns name_env for devnet", () => {
    expect(currencyIdFromNetwork({ name: "solana", env: "devnet" })).toBe("solana_devnet");
  });

  it("throws UnknownNetworkError for unknown network", () => {
    expect(() =>
      currencyIdFromNetwork({ name: "notachain", env: "main" }),
    ).toThrow(UnknownNetworkError);
  });

  it("round-trips with networkFromCurrencyId", () => {
    expect(currencyIdFromNetwork(networkFromCurrencyId("bitcoin"))).toBe("bitcoin");
    expect(currencyIdFromNetwork(networkFromCurrencyId("bitcoin_testnet"))).toBe("bitcoin_testnet");
    expect(currencyIdFromNetwork(networkFromCurrencyId("ethereum"))).toBe("ethereum");
  });
});
