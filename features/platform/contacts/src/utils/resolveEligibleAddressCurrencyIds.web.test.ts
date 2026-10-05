import { getCryptoCurrencyById, listCryptoCurrencies } from "@domain/entity-currency-crypto";
import {
  resolveEligibleAddressCurrencyIds,
  type EligibleAddressNetwork,
} from "./resolveEligibleAddressCurrencyIds";

const NETWORKS: readonly EligibleAddressNetwork[] = [
  { id: getCryptoCurrencyById("ethereum").id, family: "evm" },
  { id: getCryptoCurrencyById("bitcoin").id, family: "bitcoin" },
  { id: getCryptoCurrencyById("base").id, family: "evm" },
  { id: getCryptoCurrencyById("tron").id, family: "tron" },
  { id: getCryptoCurrencyById("solana").id, family: "solana" },
];

const getConfig = () => ({
  status: { type: "active" as const },
  name: "Ethereum",
  unit: { name: "ether", code: "ETH", magnitude: 18 },
  chainId: 1,
});

describe("resolveEligibleAddressCurrencyIds", () => {
  it("resolves the default EVM family from production networks", () => {
    const expectedNetworkIds = listCryptoCurrencies()
      .filter(network => network.family === "evm")
      .map(network => network.id);
    const excludedNetworkIds = listCryptoCurrencies(true)
      .filter(network => network.family === "evm" && Boolean(network.isTestnetFor))
      .map(network => network.id);
    const networkIds = resolveEligibleAddressCurrencyIds(["evm"], undefined, [], getConfig);

    expect(networkIds).toEqual(expectedNetworkIds);
    expect(expectedNetworkIds).not.toHaveLength(0);
    expect(excludedNetworkIds).not.toHaveLength(0);
    expect(networkIds).toEqual(expect.not.arrayContaining(excludedNetworkIds));
  });

  it("includes EVM networks whose config carries a chain ID", () => {
    const networkIds = resolveEligibleAddressCurrencyIds(["evm"], undefined, [], getConfig);

    expect(networkIds).toContain("sei_evm");
    expect(networkIds).toContain("poa");
  });

  it("omits EVM networks whose config carries no chain ID", () => {
    expect(resolveEligibleAddressCurrencyIds(["evm"], undefined, [], () => undefined)).toEqual([]);
  });

  it("resolves future multi-family values in network order", () => {
    expect(resolveEligibleAddressCurrencyIds(["evm", "tron"], NETWORKS, [], getConfig)).toEqual([
      "ethereum",
      "base",
      "tron",
    ]);
  });

  it("returns no networks for unknown families", () => {
    expect(resolveEligibleAddressCurrencyIds(["unknown"], NETWORKS, [], getConfig)).toEqual([]);
  });

  it("omits explicitly excluded currency ids from the result", () => {
    expect(
      resolveEligibleAddressCurrencyIds(["evm", "tron"], NETWORKS, ["ethereum", "tron"], getConfig),
    ).toEqual(["base"]);
  });

  it("returns an empty array when all eligible networks are excluded", () => {
    expect(
      resolveEligibleAddressCurrencyIds(["evm"], NETWORKS, ["ethereum", "base"], getConfig),
    ).toEqual([]);
  });

  it("deduplicates network ids while preserving their first occurrence", () => {
    expect(
      resolveEligibleAddressCurrencyIds(
        ["evm"],
        [...NETWORKS, { id: getCryptoCurrencyById("ethereum").id, family: "evm" }],
        [],
        getConfig,
      ),
    ).toEqual(["ethereum", "base"]);
  });
});
