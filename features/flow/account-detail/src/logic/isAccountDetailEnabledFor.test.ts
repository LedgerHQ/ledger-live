import { isAccountDetailEnabledFor } from "./isAccountDetailEnabledFor";

describe("isAccountDetailEnabledFor", () => {
  it("is disabled when the flag is missing", () => {
    expect(isAccountDetailEnabledFor(null, "bitcoin")).toBe(false);
  });

  it("is disabled when the flag is off", () => {
    expect(
      isAccountDetailEnabledFor({ enabled: false, params: { excludedCurrencyIds: [] } }, "bitcoin"),
    ).toBe(false);
  });

  it("is enabled for every currency when the flag is on with no exclusion", () => {
    expect(isAccountDetailEnabledFor({ enabled: true }, "bitcoin")).toBe(true);
  });

  it("is disabled for an excluded currency only", () => {
    const feature = { enabled: true, params: { excludedCurrencyIds: ["solana"] } };

    expect(isAccountDetailEnabledFor(feature, "solana")).toBe(false);
    expect(isAccountDetailEnabledFor(feature, "bitcoin")).toBe(true);
  });
});
