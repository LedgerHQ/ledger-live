import { resolveMarkerColor } from "../utils/resolveMarkerColor";
import { LINE_CHART_COLOR_TO_STROKE } from "../constants";

describe("resolveMarkerColor", () => {
  it("returns undefined when no color is provided", () => {
    expect(resolveMarkerColor(undefined)).toBeUndefined();
  });

  it("maps named colors to their stroke token", () => {
    expect(resolveMarkerColor("success")).toBe(LINE_CHART_COLOR_TO_STROKE.success);
    expect(resolveMarkerColor("error")).toBe(LINE_CHART_COLOR_TO_STROKE.error);
    expect(resolveMarkerColor("muted")).toBe(LINE_CHART_COLOR_TO_STROKE.muted);
  });

  it("passes through raw color strings unchanged", () => {
    expect(resolveMarkerColor("#ff0000")).toBe("#ff0000");
    expect(resolveMarkerColor("rgb(0, 0, 0)")).toBe("rgb(0, 0, 0)");
  });
});
