/**
 * Locale utility functions for parsing and extracting information from BCP 47 locale strings.
 */

/**
 * Extracts the ISO 3166-1 alpha-2 country code from a BCP 47 locale string.
 *
 * @param locale - A BCP 47 locale string (e.g., "fr-FR", "en-US", "de-DE")
 * @returns The lowercase country code (e.g., "fr", "us", "de") or undefined if not present
 *
 * @example
 * getCountryCodeFromLocale("fr-FR") // "fr"
 * getCountryCodeFromLocale("en-US") // "us"
 * getCountryCodeFromLocale("en")    // undefined
 */
export function getCountryCodeFromLocale(locale: string): string | undefined {
  const parts = locale.split("-");
  return parts.length > 1 ? parts[1].toLowerCase() : undefined;
}
