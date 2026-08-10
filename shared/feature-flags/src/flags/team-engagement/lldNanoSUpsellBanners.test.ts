import { lldNanoSUpsellBanners } from "./lldNanoSUpsellBanners";

describe("lldNanoSUpsellBanners", () => {
  it("should enable portfolio for opted_in users by default", () => {
    const defaults = lldNanoSUpsellBanners.parse(undefined);

    expect(defaults.params?.opted_in.portfolio).toBe(true);
    expect(defaults.params?.opted_out.portfolio).toBe(true);
  });

  it("should default missing portfolio to enabled for legacy opted_in params", () => {
    const defaults = lldNanoSUpsellBanners.parse(undefined);

    if (!defaults.params) {
      throw new Error("Expected lldNanoSUpsellBanners default params");
    }

    const { portfolio: _portfolio, ...legacyOptedIn } = defaults.params.opted_in;
    const result = lldNanoSUpsellBanners.parse({
      enabled: true,
      params: {
        opted_in: legacyOptedIn,
        opted_out: defaults.params.opted_out,
      },
    });

    expect(result.params?.opted_in.portfolio).toBe(true);
  });
});
