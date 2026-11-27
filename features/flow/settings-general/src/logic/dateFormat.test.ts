import { isDateFormatUpdate, isSettingsDateFormat } from "./dateFormat";

describe("isSettingsDateFormat", () => {
  it("accepts the three formats only", () => {
    expect(isSettingsDateFormat("default")).toBe(true);
    expect(isSettingsDateFormat("DD/MM/YYYY")).toBe(true);
    expect(isSettingsDateFormat("MM/DD/YYYY")).toBe(true);
    expect(isSettingsDateFormat("YYYY-MM-DD")).toBe(false);
  });
});

describe("isDateFormatUpdate", () => {
  it("is true for the dateFormat key only", () => {
    expect(isDateFormatUpdate({ key: "dateFormat" })).toBe(true);
    expect(isDateFormatUpdate({ key: "theme" })).toBe(false);
  });
});
