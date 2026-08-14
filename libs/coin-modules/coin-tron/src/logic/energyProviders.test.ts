import { ENERGY_PROVIDERS, TRONIFY_PROVIDER, getEnergyProvider } from "./energyProviders";

describe("energyProviders", () => {
  it("registers Tronify with a disclosable display name", () => {
    expect(TRONIFY_PROVIDER).toEqual({ id: "tronify", name: "Tronify" });
    expect(ENERGY_PROVIDERS).toContain(TRONIFY_PROVIDER);
  });

  it("resolves a known provider id to its metadata", () => {
    expect(getEnergyProvider("tronify")).toEqual({ id: "tronify", name: "Tronify" });
  });

  it("returns undefined for an unknown provider id", () => {
    expect(getEnergyProvider("unknown")).toBeUndefined();
  });
});
