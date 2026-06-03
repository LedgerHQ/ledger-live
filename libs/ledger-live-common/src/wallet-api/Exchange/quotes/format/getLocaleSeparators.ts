/**
 * Extract locale-aware decimal + thousands separators from
 * `Intl.NumberFormat` so formatted quote strings stay stable across
 * wallet-side formatting paths.
 *
 * @param locale - BCP 47 tag (e.g. `"en"`, `"fr"`).
 * @returns `{ decimal, thousands }` pair for the locale, falling back to
 *   `"."` / `","` when `Intl.NumberFormat` throws on an unknown tag.
 */
export function getLocaleSeparators(locale: string): { decimal: string; thousands: string } {
  try {
    const formatter = new Intl.NumberFormat(locale);
    const parts = formatter.formatToParts(10000.2);

    let decimal = ".";
    let thousands = ",";

    for (const part of parts) {
      if (part.type === "decimal") {
        decimal = part.value;
      } else if (part.type === "group") {
        thousands = part.value;
      }
    }

    return { decimal, thousands };
  } catch {
    return { decimal: ".", thousands: "," };
  }
}
