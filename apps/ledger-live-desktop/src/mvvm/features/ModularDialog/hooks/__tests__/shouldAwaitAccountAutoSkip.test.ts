import { MODULAR_DIALOG_STEP } from "../../types";
import { shouldAwaitAccountAutoSkip } from "../shouldAwaitAccountAutoSkip";

const matchingParams = {
  areCurrenciesFiltered: true,
  currencyIds: ["ethereum"],
  currentStep: MODULAR_DIALOG_STEP.ASSET_SELECTION,
  hasError: false,
  assetsSorted: [{ id: "ethereum" }],
};

describe("shouldAwaitAccountAutoSkip", () => {
  it("should return true when a single filtered currency is still loading", () => {
    expect(
      shouldAwaitAccountAutoSkip({
        ...matchingParams,
        assetsSorted: undefined,
      }),
    ).toBe(true);
  });

  it("should return true when a single filtered currency has exactly one asset", () => {
    expect(shouldAwaitAccountAutoSkip(matchingParams)).toBe(true);
  });

  it("should return false when currencies are not filtered", () => {
    expect(
      shouldAwaitAccountAutoSkip({
        ...matchingParams,
        areCurrenciesFiltered: false,
      }),
    ).toBe(false);
  });

  it("should return false when more than one currency is filtered", () => {
    expect(
      shouldAwaitAccountAutoSkip({
        ...matchingParams,
        currencyIds: ["ethereum", "bitcoin"],
      }),
    ).toBe(false);
  });

  it("should return false when the current step is not asset selection", () => {
    expect(
      shouldAwaitAccountAutoSkip({
        ...matchingParams,
        currentStep: MODULAR_DIALOG_STEP.ACCOUNT_SELECTION,
      }),
    ).toBe(false);
  });

  it("should return false when remote data has an error", () => {
    expect(
      shouldAwaitAccountAutoSkip({
        ...matchingParams,
        hasError: true,
      }),
    ).toBe(false);
  });

  it("should return false when more than one asset is available", () => {
    expect(
      shouldAwaitAccountAutoSkip({
        ...matchingParams,
        assetsSorted: [{ id: "ethereum" }, { id: "bitcoin" }],
      }),
    ).toBe(false);
  });
});
