import { largeScreenUpsell } from "./largeScreenUpsell";

describe("largeScreenUpsell", () => {
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
