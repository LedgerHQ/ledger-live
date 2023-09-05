import { getSpecs } from ".";
import { setSupportedCurrencies } from "../currencies/index";

describe("getSpecs", () => {
  it("should filter currencies correctly", () => {
    setSupportedCurrencies(["bitcoin", "ethereum"]);
    const specs = getSpecs({ disabled: {}, filter: { currencies: ["bitcoin"] } });
    expect(specs[0].currency.id).toEqual("bitcoin");
  });

  it("should filter families correctly", () => {
    setSupportedCurrencies(["bitcoin", "ethereum"]);
    const specs = getSpecs({ disabled: {}, filter: { families: ["bitcoin"] } });
    expect(specs.length).toBeGreaterThan(0);
    expect(specs.every(spec => spec.currency.family === "bitcoin")).toEqual(true);
  });

  it("should disable currencies correctly", () => {
    setSupportedCurrencies(["bitcoin", "ethereum", "digibyte"]);
    const specs = getSpecs({ disabled: { currencies: ["digibyte"] }, filter: {} });
    expect(specs.find(spec => spec.currency.id === "digibyte")).toBeFalsy();
    expect(specs.find(spec => spec.currency.id === "ethereum")).toBeTruthy();
    expect(specs.find(spec => spec.currency.id === "bitcoin")).toBeTruthy();
  });

  it("should disable families correctly", () => {
    setSupportedCurrencies(["bitcoin", "ethereum", "digibyte"]);
    const specs = getSpecs({ disabled: { families: ["bitcoin"] }, filter: {} });
    expect(specs.find(spec => spec.currency.family === "bitcoin")).toBeFalsy();
    expect(specs.filter(spec => spec.currency.family === "ethereum").length).toEqual(1);
  });

  it("should return no specs with no currencies supported", () => {
    setSupportedCurrencies([]);
    const specs = getSpecs({ disabled: { families: ["bitcoin"] }, filter: {} });
    expect(specs.length).toEqual(0);
  });

  it("should return every supported specs with no filter or disabled currencies", () => {
    setSupportedCurrencies(["bitcoin", "ethereum"]);
    const specs = getSpecs({ disabled: {}, filter: {} });
    expect(specs.length).toEqual(2);
  });

  it("should prioritize filtered family over disabled ones", () => {
    setSupportedCurrencies(["bitcoin"]);
    const specs = getSpecs({
      disabled: { families: ["bitcoin"] },
      filter: { families: ["bitcoin"] },
    });
    expect(specs.length).toBeGreaterThan(0);
  });

  it("should prioritize filtered currencies over disabled ones", () => {
    setSupportedCurrencies(["bitcoin"]);
    const specs = getSpecs({
      disabled: { currencies: ["bitcoin"] },
      filter: { currencies: ["bitcoin"] },
    });
    expect(specs.length).toBeGreaterThan(0);
  });

  it("should not return unsupported currencies", () => {
    setSupportedCurrencies([]);
    const specs = getSpecs({
      disabled: {},
      filter: { currencies: ["bitcoin"] },
    });
    expect(specs.length).toEqual(0);
  });
});
