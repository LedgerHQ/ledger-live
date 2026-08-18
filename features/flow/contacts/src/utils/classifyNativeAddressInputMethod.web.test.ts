import { classifyNativeAddressInputMethod } from "./classifyNativeAddressInputMethod";

describe("classifyNativeAddressInputMethod", () => {
  it("should classify single-character edits as manual input", () => {
    expect(classifyNativeAddressInputMethod("0x123", "0x1234")).toBe("manual");
  });

  it("should classify multi-character inserts as paste", () => {
    expect(classifyNativeAddressInputMethod("0x1234", "0x1234567890")).toBe("paste");
  });
});
