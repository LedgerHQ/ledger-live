import { describe, expect, it } from "bun:test";
import {
  parseNetworkArg,
  networkFromCurrencyId,
  currencyIdFromNetwork,
  UnknownNetworkError,
} from "./network";

describe("parseNetworkArg", () => {
  it.each([
    ["bitcoin", "bitcoin"],
    ["Ethereum", "ethereum"],
    ["bitcoin_testnet", "bitcoin_testnet"],
    ["Ethereum_Sepolia", "ethereum_sepolia"],
  ])("reads the network id %s", (input, network) => {
    expect(parseNetworkArg(input)).toBe(network);
  });

  it.each([
    ["ethereum:mainnet", "ethereum"],
    ["ethereum:MAINNET", "ethereum"],
    ["bitcoin", "bitcoin"],
    ["bitcoin:testnet", "bitcoin_testnet"],
    ["solana:devnet", "solana_devnet"],
    ["Bitcoin:TESTNET", "bitcoin_testnet"],
  ])("reads the deprecated <name>:<env> form %s", (input, network) => {
    expect(parseNetworkArg(input)).toBe(network);
  });
});

describe("parseNetworkArg rejects", () => {
  it.each(["ethereum:main:sepolia", "ethereum:"])("the malformed selector %s", input => {
    expect(() => parseNetworkArg(input)).toThrow(UnknownNetworkError);
  });
});

describe("currencyIdFromNetwork", () => {
  it.each(["bitcoin", "bitcoin_testnet", "solana_devnet", "ethereum"])("round-trips %s", id => {
    expect(currencyIdFromNetwork(networkFromCurrencyId(id))).toBe(id);
  });

  it("throws UnknownNetworkError for unknown network", () => {
    expect(() => currencyIdFromNetwork("notachain")).toThrow(UnknownNetworkError);
  });
});
