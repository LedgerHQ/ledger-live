import { getRegionChoices, getRegionLabel, toAllowedRegionLocale } from "./regionChoices";
import { isRegionLocale, REGION_LOCALES, SANCTIONED_REGION_LOCALES } from "./regionLocales";

describe("isRegionLocale", () => {
  it("knows the locales the app can format", () => {
    expect(isRegionLocale("fr-FR")).toBe(true);
    expect(isRegionLocale("xx-YY")).toBe(false);
  });
});

describe("toAllowedRegionLocale", () => {
  it("keeps an allowed locale", () => {
    expect(toAllowedRegionLocale("fr-FR")).toBe("fr-FR");
  });

  it.each([...SANCTIONED_REGION_LOCALES])("replaces the sanctioned %s by en-US", locale => {
    expect(toAllowedRegionLocale(locale)).toBe("en-US");
  });
});

describe("getRegionLabel", () => {
  it("names the region and its language in the app language", () => {
    expect(getRegionLabel("fr-FR", "en")).toBe("France (French)");
    expect(getRegionLabel("fr-FR", "fr")).toBe("France (Français)");
  });

  it("names a sanctioned locale as en-US", () => {
    expect(getRegionLabel("ru-RU", "en")).toBe("United States (English)");
  });

  it("falls back to the locale when the engine cannot name the region", () => {
    const displayNames = jest.spyOn(Intl, "DisplayNames").mockImplementation(() => {
      throw new RangeError("unsupported");
    });

    expect(getRegionLabel("fr-FR", "en")).toBe("fr-FR");

    displayNames.mockRestore();
  });
});

describe("getRegionChoices", () => {
  const choices = getRegionChoices("en");

  it("offers every region but the sanctioned ones", () => {
    expect(choices).toHaveLength(
      REGION_LOCALES.filter(locale => !SANCTIONED_REGION_LOCALES.has(locale)).length,
    );
    expect(choices.map(choice => choice.value)).not.toContain("ru-RU");
  });

  it("sorts the regions by name", () => {
    const labels = choices.map(choice => choice.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it("stores the locale as the value", () => {
    expect(choices).toContainEqual({ value: "fr-FR", label: "France (French)" });
  });
});
