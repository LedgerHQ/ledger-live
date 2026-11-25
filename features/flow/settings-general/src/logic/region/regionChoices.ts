import type { SettingsChoice } from "../../ports";
import { REGION_LOCALES, SANCTIONED_REGION_LOCALES } from "./regionLocales";

const FALLBACK_REGION_LOCALE = "en-US";

/** The locale stored for a region: a sanctioned one falls back to `en-US`. */
export function toAllowedRegionLocale(locale: string): string {
  return SANCTIONED_REGION_LOCALES.has(locale) ? FALLBACK_REGION_LOCALE : locale;
}

function displayName(
  locale: string,
  type: "language" | "region",
  code: string,
): string | undefined {
  try {
    return new Intl.DisplayNames([locale], { type }).of(code);
  } catch {
    return undefined;
  }
}

function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Region (Language)" in the app language, or the locale itself when the engine cannot name it. */
export function getRegionLabel(regionLocale: string, uiLanguage: string): string {
  const [language, region = ""] = toAllowedRegionLocale(regionLocale).split("-");
  const regionName = region ? displayName(uiLanguage, "region", region) : undefined;
  if (!regionName) return regionLocale;
  const languageName = displayName(uiLanguage, "language", language);
  return languageName
    ? `${upperFirst(regionName)} (${upperFirst(languageName)})`
    : upperFirst(regionName);
}

/** Every region a user can pick, named in the app language and sorted by name. */
export function getRegionChoices(uiLanguage: string): SettingsChoice[] {
  return REGION_LOCALES.filter(locale => !SANCTIONED_REGION_LOCALES.has(locale))
    .map(locale => ({ value: locale, label: getRegionLabel(locale, uiLanguage) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
