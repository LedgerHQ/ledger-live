import { rbgToLuminance, hexToRgb } from "./rgb";

describe("hexToRgb", () => {
  it("should convert hex color to RGB correctly", () => {
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#FF5733")).toEqual({ r: 255, g: 87, b: 51 });
    expect(hexToRgb("#4A90E2")).toEqual({ r: 74, g: 144, b: 226 });
  });
});

describe("rbgToLuminance", () => {
  it("should calc luminance correctly", () => {
    expect(rbgToLuminance(255, 255, 255)).toEqual(255);
    expect(rbgToLuminance(0, 0, 0)).toEqual(0);
    expect(rbgToLuminance(125, 125, 125)).toEqual(125);
    expect(rbgToLuminance(255, 0, 125)).toEqual(90);
  });
});
