import { resolveMarkerColor } from "../utils/resolveMarkerColor";

const BG = {
  successStrong: "#00c853",
  errorStrong: "#d50000",
  mutedStrong: "#9e9e9e",
};

describe("resolveMarkerColor", () => {
  it("returns undefined when no color is provided", () => {
    expect(resolveMarkerColor(undefined, BG)).toBeUndefined();
  });

  it("maps named colors to their theme stroke", () => {
    expect(resolveMarkerColor("success", BG)).toBe(BG.successStrong);
    expect(resolveMarkerColor("error", BG)).toBe(BG.errorStrong);
    expect(resolveMarkerColor("muted", BG)).toBe(BG.mutedStrong);
  });

  it("passes through raw color strings unchanged", () => {
    expect(resolveMarkerColor("#ff0000", BG)).toBe("#ff0000");
    expect(resolveMarkerColor("rgb(0, 0, 0)", BG)).toBe("rgb(0, 0, 0)");
  });
});
