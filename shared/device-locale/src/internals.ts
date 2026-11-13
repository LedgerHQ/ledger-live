// Private to the package: no barrel re-exports this file.

export type PreferredLocale = Readonly<{
  languageTag: string;
  languageCode: string | null;
  languageScriptCode: string | null;
  languageRegionCode: string | null;
}>;

function candidateTags({
  languageTag,
  languageCode,
  languageScriptCode,
  languageRegionCode,
}: PreferredLocale): string[] {
  return [
    languageTag,
    languageCode && languageScriptCode ? `${languageCode}-${languageScriptCode}` : null,
    languageCode && languageRegionCode ? `${languageCode}-${languageRegionCode}` : null,
    languageCode,
  ].filter((tag): tag is string => !!tag);
}

// Same order as react-native-localize 2.2.6, which this replaces: the user's first preferred
// language wins over a closer match on a later one.
export function matchLanguage<T extends string>(
  preferredLocales: readonly PreferredLocale[],
  supported: readonly T[],
): T | undefined {
  const loweredSupported = supported.map(tag => tag.toLowerCase());

  for (const locale of preferredLocales) {
    for (const tag of candidateTags(locale)) {
      const index = loweredSupported.indexOf(tag.toLowerCase());

      if (index !== -1) {
        return supported[index];
      }
    }
  }

  return undefined;
}
