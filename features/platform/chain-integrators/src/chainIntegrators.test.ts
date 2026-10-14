import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import {
  INTEGRATED_CHAIN_FAMILIES,
  CHAIN_INTEGRATORS,
  getChainIntegrator,
} from "./chainIntegrators";

describe("chainIntegrators registry", () => {
  it("only lists families that exist in the currency registry", () => {
    const knownFamilies = new Set(
      Object.values(CRYPTO_CURRENCIES_REGISTRY).map(currency => currency.family),
    );
    const unknownFamilies = Object.keys(INTEGRATED_CHAIN_FAMILIES).filter(
      family => !knownFamilies.has(family),
    );

    expect(unknownFamilies).toEqual([]);
  });

  it("uses every declared integrator at least once", () => {
    const usedIntegrators = new Set<string>(Object.values(INTEGRATED_CHAIN_FAMILIES));
    const unusedIntegrators = Object.keys(CHAIN_INTEGRATORS).filter(id => !usedIntegrators.has(id));

    expect(unusedIntegrators).toEqual([]);
  });

  it("keeps families and integrators sorted alphabetically", () => {
    const families = Object.keys(INTEGRATED_CHAIN_FAMILIES);
    const integrators = Object.keys(CHAIN_INTEGRATORS);

    expect(families).toEqual([...families].sort());
    expect(integrators).toEqual([...integrators].sort());
  });
});

describe("getChainIntegrator", () => {
  it.each([
    ["solana", "Solana Labs"],
    ["cardano", "Strica"],
    ["ton", "Zondax"],
    ["sui", "Figment"],
    ["stellar", "Stellar Development Foundation"],
  ])("returns the integrator of %s", (family, integrator) => {
    expect(getChainIntegrator(family)).toBe(integrator);
  });

  it.each(["evm", "bitcoin", "", "toString", "constructor"])("returns null for %p", family => {
    expect(getChainIntegrator(family)).toBeNull();
  });
});
