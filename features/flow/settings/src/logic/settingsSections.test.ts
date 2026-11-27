import { SETTINGS_SECTIONS, resolveSettingsSection } from "./settingsSections";

describe("resolveSettingsSection", () => {
  it.each(SETTINGS_SECTIONS)("keeps the known section %s", section => {
    expect(resolveSettingsSection(section)).toBe(section);
  });

  it.each([undefined, null, "", "display", "developer", 42])(
    "falls back to general for %p",
    section => {
      expect(resolveSettingsSection(section)).toBe("general");
    },
  );
});
