import { getCalendars, getLocales } from "expo-localization";
import { deviceRegionOf, matchLanguage, toLegacyLocales } from "./internals";

/**
 * The user's first preferred language as `language[-Script]-COUNTRY` (`fr-FR`, `en-US`), the
 * format of react-native-localize 2.2.6: the country falls back to the device region.
 */
export function getDeviceLanguageTag(): string | undefined {
  return toLegacyLocales(getLocales())[0]?.languageTag;
}

/** The region picked in the device settings (`GB`), not the language's; `US` when unknown. */
export function getDeviceRegion(): string {
  return deviceRegionOf(getLocales());
}

/** The device time zone, as an IANA name (`Europe/Paris`). */
export function getDeviceTimeZone(): string | undefined {
  return getCalendars()[0]?.timeZone ?? undefined;
}

/**
 * Picks the entry of `supported` that best matches the user's preferred languages, trying for
 * each of them, in order: the full tag, language-script, language-country, then language alone.
 */
export function findBestAvailableLanguage<T extends string>(
  supported: readonly T[],
): T | undefined {
  return matchLanguage(toLegacyLocales(getLocales()), supported);
}
