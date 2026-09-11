const ALLOWED_PROTOCOLS = new Set(["https:", "mailto:"]);

export function assertSafeUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Blocked unsafe protocol "${parsed.protocol}" in URL: ${url}`);
  }
}
