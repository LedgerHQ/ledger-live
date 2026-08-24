import { getCryptoCurrencyById, listCryptoCurrencies } from "@domain/entity-currency-crypto";
import {
  resolveEligibleAddressCurrencyIds,
  type EligibleAddressNetwork,
} from "./resolveEligibleAddressCurrencyIds";

const NETWORKS: readonly EligibleAddressNetwork[] = [
  { id: getCryptoCurrencyById("ethereum").id, family: "evm" },
  { id: getCryptoCurrencyById("bitcoin").id, family: "bitcoin" },
  { id: getCryptoCurrencyById("base").id, family: "evm" },
  { id: getCryptoCurrencyById("solana").id, family: "solana" },
];

describe("resolveEligibleAddressCurrencyIds", () => {
  it("resolves the default EVM family from production networks", () => {
    const expectedNetworkIds = listCryptoCurrencies()
      .filter(network => network.family === "evm")
      .map(network => network.id);
    const excludedNetworkIds = listCryptoCurrencies(true)
      .filter(
        network => network.family === "evm" && Boolean(network.isTestnetFor || network.delisted),
      )
      .map(network => network.id);
    const networkIds = resolveEligibleAddressCurrencyIds(["evm"]);

    expect(networkIds).toEqual(expectedNetworkIds);
    expect(expectedNetworkIds).not.toHaveLength(0);
    expect(excludedNetworkIds).not.toHaveLength(0);
    expect(networkIds).toEqual(expect.not.arrayContaining(excludedNetworkIds));
  });

  it("resolves future multi-family values in network order", () => {
    expect(resolveEligibleAddressCurrencyIds(["evm", "bitcoin"], NETWORKS)).toEqual([
      "ethereum",
      "bitcoin",
      "base",
    ]);
  });

  it("returns no networks for unknown families", () => {
    expect(resolveEligibleAddressCurrencyIds(["unknown"], NETWORKS)).toEqual([]);
  });

  it("deduplicates network ids while preserving their first occurrence", () => {
    expect(
      resolveEligibleAddressCurrencyIds(
        ["evm"],
        [...NETWORKS, { id: getCryptoCurrencyById("ethereum").id, family: "evm" }],
      ),
    ).toEqual(["ethereum", "base"]);
  });
});
