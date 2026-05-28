import { resolveLineChartStroke } from "../utils/resolveLineChartStroke";

const MOCK_BG = {
  successStrong: "#00FF00",
  errorStrong: "#FF0000",
  mutedStrong: "#888888",
} as const;

describe("resolveLineChartStroke", () => {
  it("maps success, error, and muted to the corresponding bg tokens", () => {
    expect(resolveLineChartStroke("success", MOCK_BG)).toBe("#00FF00");
    expect(resolveLineChartStroke("error", MOCK_BG)).toBe("#FF0000");
    expect(resolveLineChartStroke("muted", MOCK_BG)).toBe("#888888");
  });
});
