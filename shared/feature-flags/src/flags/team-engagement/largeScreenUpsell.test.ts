import { largeScreenUpsell } from "./largeScreenUpsell";

describe("largeScreenUpsell", () => {
  it("should enable every banner placement by default", () => {
    const defaults = largeScreenUpsell.parse(undefined);

    expect(defaults.params?.banners).toEqual({
      "my-ledger": true,
      "notification-center": true,
      accounts: true,
      homepage: true,
    });
  });

  it("should default missing banner placements to enabled", () => {
    const defaults = largeScreenUpsell.parse(undefined);

    if (!defaults.params) {
      throw new Error("Expected large-screen upsell default params");
    }

    const result = largeScreenUpsell.parse({
      enabled: true,
      params: {
        ...defaults.params,
        banners: { homepage: false },
      },
    });

    expect(result.params?.banners).toEqual({
      "my-ledger": true,
      "notification-center": true,
      accounts: true,
      homepage: false,
    });
  });

  it("should add banner defaults to legacy params", () => {
    const defaults = largeScreenUpsell.parse(undefined);

    if (!defaults.params) {
      throw new Error("Expected large-screen upsell default params");
    }

    const { banners: _banners, ...legacyParams } = defaults.params;
    const result = largeScreenUpsell.parse({ enabled: true, params: legacyParams });

    expect(result.params?.banners).toEqual({
      "my-ledger": true,
      "notification-center": true,
      accounts: true,
      homepage: true,
    });
  });

  it("should default variant enabled states to false when they are missing", () => {
    const defaults = largeScreenUpsell.parse(undefined);

    if (!defaults.params) {
      throw new Error("Expected large-screen upsell default params");
    }

    const result = largeScreenUpsell.parse({
      enabled: true,
      params: {
        ...defaults.params,
        opted_in: { link: defaults.params.opted_in.link },
        opted_out: { link: defaults.params.opted_out.link },
      },
    });

    expect(result.params?.opted_in.enabled).toBe(false);
    expect(result.params?.opted_out.enabled).toBe(false);
  });
});
