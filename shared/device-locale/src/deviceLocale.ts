import { getCalendars, getLocales } from "expo-localization";
import { matchLanguage } from "./internals";

/** The user's first preferred language, as a BCP 47 tag (`fr-FR`). */
export function getDeviceLanguageTag(): string | undefined {
  return getLocales()[0]?.languageTag;
}

/** The region picked in the device settings (`GB`), which can differ from the language's region. */
export function getDeviceRegion(): string | undefined {
  return getLocales()[0]?.regionCode ?? undefined;
}

/** The device time zone, as an IANA name (`Europe/Paris`). */
export function getDeviceTimeZone(): string | undefined {
  return getCalendars()[0]?.timeZone ?? undefined;
}

/**
 * Picks the entry of `supported` that best matches the user's preferred languages, trying for
 * each of them, in order: the full tag, language-script, language-region, then language alone.
 */
export function findBestAvailableLanguage<T extends string>(
  supported: readonly T[],
): T | undefined {
  return matchLanguage(getLocales(), supported);
}
