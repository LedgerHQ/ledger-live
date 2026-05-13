import { isCurrencyAllowedForNewSendFlow } from "../useNewSendFlowFeature";

describe("isCurrencyAllowedForNewSendFlow", () => {
  const allowedFamilies = ["bitcoin", "evm"];

  it("should return true when family is allowed and currency is not excluded", () => {
    expect(
      isCurrencyAllowedForNewSendFlow({
        family: "bitcoin",
        currencyId: "bitcoin",
        allowedFamilies,
        excludedCurrencyIds: ["zcash"],
      }),
    ).toBe(true);
  });

  it("should return false when currency is excluded even if family is allowed", () => {
    expect(
      isCurrencyAllowedForNewSendFlow({
        family: "bitcoin",
        currencyId: "zcash",
        allowedFamilies,
        excludedCurrencyIds: ["zcash"],
      }),
    ).toBe(false);
  });

  it("should return false when family is not allowed", () => {
    expect(
      isCurrencyAllowedForNewSendFlow({
        family: "solana",
        currencyId: "solana",
        allowedFamilies,
        excludedCurrencyIds: [],
      }),
    ).toBe(false);
  });

  it("should return true when family is missing", () => {
    expect(
      isCurrencyAllowedForNewSendFlow({
        allowedFamilies,
        excludedCurrencyIds: [],
      }),
    ).toBe(true);
  });
});
