// Private to the package: no barrel re-exports this file.

// The package keeps the values of react-native-localize 2.2.6, which it replaces, so the analytics
// and live app inputs built on them do not change.

export type PreferredLocale = Readonly<{
  languageTag: string;
  languageCode: string | null;
  languageScriptCode: string | null;
  languageRegionCode: string | null;
  regionCode: string | null;
}>;

type LegacyLocale = Readonly<{
  languageTag: string;
  languageCode: string;
  scriptCode: string | null;
  countryCode: string;
}>;

const FALLBACK_REGION = "US";

const LEGACY_TO_CURRENT_LANGUAGE_CODES: Readonly<Record<string, string>> = {
  iw: "he",
  in: "id",
  ji: "yi",
};

function normalizeRegion(region: string | null): string | undefined {
  if (!region) {
    return undefined;
  }

  return region === "419" ? "UN" : region.toUpperCase();
}

function normalizeLanguageCode({ languageCode, languageTag }: PreferredLocale): string {
  const code = (languageCode ?? languageTag.split("-")[0]).toLowerCase();

  return LEGACY_TO_CURRENT_LANGUAGE_CODES[code] ?? code;
}

export function deviceRegionOf(preferredLocales: readonly PreferredLocale[]): string {
  return normalizeRegion(preferredLocales[0]?.regionCode ?? null) ?? FALLBACK_REGION;
}

export function toLegacyLocales(preferredLocales: readonly PreferredLocale[]): LegacyLocale[] {
  const deviceRegion = deviceRegionOf(preferredLocales);

  return preferredLocales.map(locale => {
    const languageCode = normalizeLanguageCode(locale);
    const scriptCode = locale.languageScriptCode || null;
    const countryCode = normalizeRegion(locale.languageRegionCode) ?? deviceRegion;
    const languageWithScript = scriptCode ? `${languageCode}-${scriptCode}` : languageCode;

    return {
      languageTag: `${languageWithScript}-${countryCode}`,
      languageCode,
      scriptCode,
      countryCode,
    };
  });
}

function candidateTags({ languageTag, languageCode, scriptCode, countryCode }: LegacyLocale) {
  return [
    languageTag,
    scriptCode ? `${languageCode}-${scriptCode}` : null,
    `${languageCode}-${countryCode}`,
    languageCode,
  ].filter((tag): tag is string => !!tag);
}

// The user's first preferred language wins over a closer match on a later one.
export function matchLanguage<T extends string>(
  legacyLocales: readonly LegacyLocale[],
  supported: readonly T[],
): T | undefined {
  const loweredSupported = supported.map(tag => tag.toLowerCase());

  for (const locale of legacyLocales) {
    for (const tag of candidateTags(locale)) {
      const index = loweredSupported.indexOf(tag.toLowerCase());

      if (index !== -1) {
        return supported[index];
      }
    }
  }

  return undefined;
}
