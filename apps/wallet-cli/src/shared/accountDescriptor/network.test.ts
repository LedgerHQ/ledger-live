import { describe, expect, it } from "bun:test";
import {
  parseNetworkArg,
  mainnetOf,
  networkOfV0,
  networkFromCurrencyId,
  currencyIdFromNetwork,
  NetworkIdSchema,
  UnknownNetworkError,
  UnsupportedNetworkError,
} from "./network";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";

const net = (id: string) => NetworkIdSchema.parse(id);

describe("parseNetworkArg", () => {
  it.each([
    ["bitcoin", "bitcoin"],
    ["Ethereum", "ethereum"],
    ["bitcoin_testnet", "bitcoin_testnet"],
    ["Ethereum_Sepolia", "ethereum_sepolia"],
  ])("reads the network id %s", (input, network) => {
    expect(parseNetworkArg(input)).toBe(net(network));
  });

  it.each([
    ["ethereum:mainnet", "ethereum"],
    ["ethereum:MAINNET", "ethereum"],
    ["bitcoin", "bitcoin"],
    ["bitcoin:testnet", "bitcoin_testnet"],
    ["solana:devnet", "solana_devnet"],
    ["Bitcoin:TESTNET", "bitcoin_testnet"],
  ])("reads the deprecated <name>:<env> form %s", (input, network) => {
    expect(parseNetworkArg(input)).toBe(net(network));
  });
});

describe("parseNetworkArg rejects", () => {
  it.each(["ethereum:main:sepolia", "ethereum:", "", "bit coin", "bitcoin ", "bit coin:testnet"])(
    "the malformed selector %p",
    input => {
      expect(() => parseNetworkArg(input)).toThrow(UnknownNetworkError);
    },
  );
});

describe("networkOfV0", () => {
  it("reads the network of the currency id", () => {
    expect(networkOfV0({ currencyId: "bitcoin_testnet" })).toBe(net("bitcoin_testnet"));
  });

  it.each([
    ["", 'Unknown network ""'],
    ["notachain", 'Unknown network "notachain"'],
  ])("throws UnknownNetworkError for the currency id %p", (currencyId, message) => {
    expect(() => networkOfV0({ currencyId })).toThrow(new UnknownNetworkError(message));
  });
});

describe("currencyIdFromNetwork", () => {
  it.each(["bitcoin", "bitcoin_testnet", "solana_devnet", "ethereum"])("round-trips %s", id => {
    const currencyId = CryptoCurrencyIdSchema.parse(id);
    expect(currencyIdFromNetwork(networkFromCurrencyId(currencyId))).toBe(currencyId);
  });

  it("throws UnknownNetworkError for unknown network", () => {
    expect(() => currencyIdFromNetwork(net("notachain"))).toThrow(UnknownNetworkError);
  });

  it("throws UnsupportedNetworkError for a known network wallet-cli does not support", () => {
    expect(() => currencyIdFromNetwork("base")).toThrow(UnsupportedNetworkError);
    expect(() => currencyIdFromNetwork("base")).toThrow(/"base" is not supported/);
  });

  it("throws UnsupportedNetworkError for a testnet of an unsupported network", () => {
    expect(() => currencyIdFromNetwork("base_sepolia")).toThrow(UnsupportedNetworkError);
  });

  it.each([
    "bitcoin_testnet",
    "bitcoin_regtest",
    "ethereum_sepolia",
    "ethereum_hoodi",
    "solana_devnet",
    "solana_testnet",
  ])("accepts the %s testnet of a supported network", network => {
    expect(currencyIdFromNetwork(network)).toBe(network);
  });
});

describe("mainnetOf", () => {
  it("maps a testnet to its mainnet and keeps a mainnet", () => {
    expect(mainnetOf(net("solana_testnet"))).toBe(net("solana"));
    expect(mainnetOf(net("solana_devnet"))).toBe(net("solana"));
    expect(mainnetOf(net("ethereum_sepolia"))).toBe(net("ethereum"));
    expect(mainnetOf(net("solana"))).toBe(net("solana"));
  });

  it("throws on an unknown network", () => {
    expect(() => mainnetOf(net("nope"))).toThrow(UnknownNetworkError);
  });
});
