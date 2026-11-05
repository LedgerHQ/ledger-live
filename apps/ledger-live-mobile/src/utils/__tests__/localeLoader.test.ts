import "@formatjs/intl-pluralrules/polyfill-force";
import { createInstance } from "i18next";
import { en, fr, ja, ru } from "~/locales";
import { isLocaleDataLoaded, loadLocaleData } from "../localeLoader";

const polyfilledPluralRules = Intl.PluralRules;

function createI18n() {
  const i18n = createInstance();
  i18n.init({
    fallbackLng: "en",
    resources: { en, fr, ja, ru },
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });
  return i18n;
}

describe("localeLoader with the Intl.PluralRules polyfill", () => {
  beforeAll(() => {
    ["en", "fr", "ja", "ru"].forEach(loadLocaleData);
  });

  it("keeps the formatjs implementation installed", () => {
    expect(Intl.PluralRules).toBe(polyfilledPluralRules);
    expect(isLocaleDataLoaded("ru")).toBe(true);
  });

  it.each([
    ["en", [1, 2, 5], ["one", "other", "other"]],
    ["fr", [0, 1, 2], ["one", "one", "other"]],
    ["ru", [1, 2, 5, 21], ["one", "few", "many", "one"]],
    ["ja", [1, 2], ["other", "other"]],
  ])("selects %s plural categories", (locale, counts, expected) => {
    const rules = new Intl.PluralRules(locale);
    expect(counts.map(n => rules.select(n))).toEqual(expected);
  });

  it.each([
    ["en", 1, "yesterday"],
    ["en", 3, "3 days ago"],
    ["fr", 1, "hier"],
    ["fr", 3, "Il y a 3 jours"],
    ["ja", 3, "3日前"],
  ])("renders %s relative days through i18next plurals (count %d)", (lng, count, expected) => {
    const i18n = createI18n();
    expect(i18n.t("common.timeAgo.days", { lng, count, time: count })).toBe(expected);
  });
});
