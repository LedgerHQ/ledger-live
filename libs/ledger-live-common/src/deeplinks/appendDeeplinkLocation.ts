const LEDGER_DEEPLINK_PROTOCOLS = new Set(["ledgerlive:", "ledgerwallet:"]);

export function appendDeeplinkLocation(urlValue: string, location: string | undefined): string {
  if (!location) return urlValue;

  try {
    const url = new URL(urlValue);

    if (!LEDGER_DEEPLINK_PROTOCOLS.has(url.protocol)) {
      return urlValue;
    }

    url.searchParams.set("deeplinkLocation", location);

    return url.toString();
  } catch {
    return urlValue;
  }
}

export function appendDeeplinkLocationIfDefined(
  urlValue: string | undefined,
  location: string | undefined,
): string | undefined {
  return urlValue ? appendDeeplinkLocation(urlValue, location) : undefined;
}
