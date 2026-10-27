import { toCurrencyStatusSignal, toCustomBannerSignal } from "./currencyConfigSignals";

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

describe("toCurrencyStatusSignal", () => {
  it("maps a migration", () => {
    expect(
      toCurrencyStatusSignal(
        { type: "migration", from: "Elrond", to: "MultiversX", link: "l" },
        formatDate,
      ),
    ).toEqual({ type: "migration", from: "Elrond", to: "MultiversX", link: "l" });
  });

  it("maps an upcoming deprecation with its formatted date", () => {
    expect(
      toCurrencyStatusSignal(
        { type: "will_be_deprecated", deprecated_date: "2027-01-01" },
        formatDate,
      ),
    ).toEqual({ type: "willBeDeprecated", date: "2027-01-01", link: undefined });
  });

  it("ignores statuses without a notice", () => {
    expect(toCurrencyStatusSignal({ type: "active" }, formatDate)).toBeUndefined();
    expect(toCurrencyStatusSignal(undefined, formatDate)).toBeUndefined();
  });
});

describe("toCustomBannerSignal", () => {
  it("maps a displayed banner", () => {
    expect(
      toCustomBannerSignal({ isDisplay: true, bannerText: "Heads up", bannerLink: "l" }),
    ).toEqual({
      text: "Heads up",
      link: "l",
    });
  });

  it("ignores a hidden or missing banner", () => {
    expect(toCustomBannerSignal({ isDisplay: false, bannerText: "Heads up" })).toBeUndefined();
    expect(toCustomBannerSignal(undefined)).toBeUndefined();
  });
});
