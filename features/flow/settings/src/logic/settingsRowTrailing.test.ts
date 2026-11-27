import { getSelectedOptionLabel, isPressableTrailing } from "./settingsRowTrailing";
import type { SettingsRowTrailing } from "../components/SettingsRow/SettingsRow.types";

const onSelect = jest.fn();

describe("isPressableTrailing", () => {
  it.each<SettingsRowTrailing>([
    { type: "chevron", onSelect },
    { type: "externalLink", onSelect },
  ])("is true for $type", trailing => {
    expect(isPressableTrailing(trailing)).toBe(true);
  });

  it.each<SettingsRowTrailing>([
    { type: "toggle", value: true, onToggle: jest.fn() },
    { type: "value", text: "1.0.0" },
    { type: "select", value: "a", options: [], onSelectOption: jest.fn() },
    { type: "button", label: "Manage", onSelect },
  ])("is false for $type", trailing => {
    expect(isPressableTrailing(trailing)).toBe(false);
  });

  it("is false without trailing", () => {
    expect(isPressableTrailing(undefined)).toBe(false);
  });
});

describe("getSelectedOptionLabel", () => {
  const options = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  it("returns the label of the selected option", () => {
    expect(getSelectedOptionLabel(options, "dark")).toBe("Dark");
  });

  it("returns undefined for an unknown value", () => {
    expect(getSelectedOptionLabel(options, "system")).toBeUndefined();
  });

  it("returns the short label of the selected option when it has one", () => {
    expect(
      getSelectedOptionLabel([{ value: "EUR", label: "Euro", shortLabel: "EUR" }], "EUR"),
    ).toBe("EUR");
  });
});
