import { earnNativeStakePosition } from "./earnNativeStakePosition";

describe("earnNativeStakePosition", () => {
  it("should default to disabled, without the account page entry", () => {
    const feature = earnNativeStakePosition.parse(undefined);

    expect(feature).toEqual({ enabled: false });
    expect(feature.params?.accountPage === true).toBe(false);
  });

  it("should keep the account page entry off for an existing enabled-only value", () => {
    const feature = earnNativeStakePosition.parse({ enabled: true });

    expect(feature).toEqual({ enabled: true });
    expect(feature.params?.accountPage === true).toBe(false);
  });

  it("should turn the account page entry on with its param", () => {
    const feature = earnNativeStakePosition.parse({ enabled: true, params: { accountPage: true } });

    expect(feature.params?.accountPage === true).toBe(true);
  });

  it("should accept empty params", () => {
    expect(earnNativeStakePosition.parse({ enabled: true, params: {} })).toEqual({
      enabled: true,
      params: {},
    });
  });

  it("should reject an account page param that is not a boolean", () => {
    expect(() =>
      earnNativeStakePosition.parse({ enabled: true, params: { accountPage: "true" } }),
    ).toThrow(/accountPage/);
  });
});
