/**
 * Derives a URL-safe slug from a DADA metaCurrencyId.
 *
 * @example toSlug("urn:crypto:meta-currency:usd_coin") // "usd-coin"
 * @example toSlug("urn:crypto:meta-currency:ethereum")  // "ethereum"
 */
export function toSlug(metaCurrencyId: string): string {
  const lastSegment = metaCurrencyId.split(":").pop() ?? metaCurrencyId;
  return lastSegment.replace(/_/g, "-");
}
