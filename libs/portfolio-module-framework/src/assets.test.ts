import { assetKeyOf } from "./assets";

describe("assetKeyOf", () => {
  it("keys the native asset as the service does", () => {
    expect(assetKeyOf({ type: "native" })).toBe("native");
    expect(assetKeyOf({ type: "native", assetReference: "" })).toBe("native");
  });

  it("keys an asset by its reference, whatever its type", () => {
    expect(assetKeyOf({ type: "erc20", assetReference: "0xtoken", assetOwner: "issuer" })).toBe(
      "0xtoken",
    );
    // Cardano tokens have the CAL type "native": the reference tells them from ada.
    expect(assetKeyOf({ type: "native", assetReference: "policy.name" })).toBe("policy.name");
  });

  it("keys an asset without reference by its type", () => {
    expect(assetKeyOf({ type: "trc10" })).toBe("trc10");
  });
});
