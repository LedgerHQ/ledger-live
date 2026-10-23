import { ENERGY_PROVIDERS, TRONIFY_PROVIDER, findEnergyProvider } from "./energyProviders";

describe("energyProviders", () => {
  it("registers Tronify with a disclosable display name and its terms", () => {
    expect(TRONIFY_PROVIDER).toEqual({
      id: "tronify",
      name: "Tronify",
      termsUrl: "https://www.tronify.io/#/Terms?sourceFlag=tronify",
    });
    expect(ENERGY_PROVIDERS).toContain(TRONIFY_PROVIDER);
  });

  it("resolves a known provider id to its metadata", () => {
    expect(findEnergyProvider("tronify")).toBe(TRONIFY_PROVIDER);
  });

  it("returns undefined for an unknown provider id", () => {
    expect(findEnergyProvider("unknown")).toBeUndefined();
  });
});
