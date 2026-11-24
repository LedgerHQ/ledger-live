import { filterSettingsOptions } from "../model/filterSettingsOptions";

const options = [
  { value: "DZD", label: "Algerian Dinar", trailingText: "DZD" },
  { value: "ARS", label: "Argentine Peso", trailingText: "ARS" },
  { value: "fr", label: "Français" },
];

describe("filterSettingsOptions", () => {
  it("keeps every option for an empty or blank query", () => {
    expect(filterSettingsOptions(options, "")).toBe(options);
    expect(filterSettingsOptions(options, "   ")).toBe(options);
  });

  it("matches the label, ignoring case", () => {
    expect(filterSettingsOptions(options, "peso").map(option => option.value)).toEqual(["ARS"]);
  });

  it("matches the code on the right", () => {
    expect(filterSettingsOptions(options, "dzd").map(option => option.value)).toEqual(["DZD"]);
  });

  it("ignores accents on both sides", () => {
    expect(filterSettingsOptions(options, "francais").map(option => option.value)).toEqual(["fr"]);
    expect(filterSettingsOptions(options, "FRANÇ").map(option => option.value)).toEqual(["fr"]);
  });

  it("returns nothing when no option matches", () => {
    expect(filterSettingsOptions(options, "yen")).toEqual([]);
  });
});
