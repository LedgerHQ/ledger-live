import { getSpecs } from ".";
import { supportOnlyForTest } from "../__tests__/test-helpers/supportedCoins";

describe("getSpecs", () => {
  it("should filter currencies correctly", () => {
    supportOnlyForTest(["bitcoin", "ethereum"]);
    const specs = getSpecs({ disabled: {}, filter: { currencies: ["bitcoin"] } });
    expect(specs[0].currency.id).toEqual("bitcoin");
  });

  it("should filter families correctly", () => {
    supportOnlyForTest(["bitcoin", "ethereum"]);
    const specs = getSpecs({ disabled: {}, filter: { families: ["bitcoin"] } });
    expect(specs.length).toBeGreaterThan(0);
    expect(specs.every(spec => spec.currency.family === "bitcoin")).toEqual(true);
  });

  it("should filter by feature correctly", () => {
    supportOnlyForTest(["bitcoin"]);
    const specs = getSpecs({ disabled: {}, filter: { features: ["send"] } });
    expect(specs[0].mutations.length).toBeGreaterThan(0);
    expect(specs[0].mutations.every(spec => spec.feature === "send")).toEqual(true);
  });

  it("should filter multiple features correctly", () => {
    supportOnlyForTest(["bitcoin"]);
    const currentFilter = ["send", "sendMax"];
    const specs = getSpecs({ disabled: {}, filter: { features: currentFilter } });
    expect(specs[0].mutations.length).toBeGreaterThan(0);
    expect(specs[0].mutations.every(spec => currentFilter.includes(spec.feature))).toEqual(true);
  });

  it("should filter no features correctly", () => {
    supportOnlyForTest(["bitcoin"]);
    const currentFilter = [];
    const specs = getSpecs({ disabled: {}, filter: { features: currentFilter } });
    expect(specs[0].mutations.length).toBeGreaterThan(0);
  });

  it("should filter features not set correctly", () => {
    supportOnlyForTest(["bitcoin"]);
    const specs = getSpecs({ disabled: {}, filter: {} });
    expect(specs[0].mutations.length).toBeGreaterThan(0);
  });

  it("should disable currencies correctly", () => {
    supportOnlyForTest(["bitcoin", "ethereum", "digibyte"]);
    const specs = getSpecs({ disabled: { currencies: ["digibyte"] }, filter: {} });
    expect(specs.find(spec => spec.currency.id === "digibyte")).toBeFalsy();
    expect(specs.find(spec => spec.currency.id === "ethereum")).toBeTruthy();
    expect(specs.find(spec => spec.currency.id === "bitcoin")).toBeTruthy();
  });

  it("should disable families correctly", () => {
    supportOnlyForTest(["bitcoin", "ethereum", "digibyte"]);
    const specs = getSpecs({ disabled: { families: ["bitcoin"] }, filter: {} });
    expect(specs.find(spec => spec.currency.family === "bitcoin")).toBeFalsy();
    expect(specs.filter(spec => spec.currency.family === "evm").length).toEqual(1);
  });

  it("should return no specs with no currencies supported", () => {
    supportOnlyForTest([]);
    const specs = getSpecs({ disabled: { families: ["bitcoin"] }, filter: {} });
    expect(specs.length).toEqual(0);
  });

  it("should return every supported specs with no filter or disabled currencies", () => {
    supportOnlyForTest(["bitcoin", "ethereum"]);
    const specs = getSpecs({ disabled: {}, filter: {} });
    expect(specs.length).toEqual(2);
  });

  it("should prioritize filtered family over disabled ones", () => {
    supportOnlyForTest(["bitcoin"]);
    const specs = getSpecs({
      disabled: { families: ["bitcoin"] },
      filter: { families: ["bitcoin"] },
    });
    expect(specs.length).toBeGreaterThan(0);
  });

  it("should prioritize filtered currencies over disabled ones", () => {
    supportOnlyForTest(["bitcoin"]);
    const specs = getSpecs({
      disabled: { currencies: ["bitcoin"] },
      filter: { currencies: ["bitcoin"] },
    });
    expect(specs.length).toBeGreaterThan(0);
  });

  it("should not return unsupported currencies", () => {
    supportOnlyForTest([]);
    const specs = getSpecs({
      disabled: {},
      filter: { currencies: ["bitcoin"] },
    });
    expect(specs.length).toEqual(0);
  });
});
