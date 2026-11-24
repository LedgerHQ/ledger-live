function withoutTrailingSlashes(url: string): string {
  let end = url.length;
  while (url.endsWith("/", end)) end--;
  return url.slice(0, end);
}

/**
 * The address the mobile app registers a Speculos under (its `addKnownSpeculos` bridge message):
 * the configured SPECULOS_ADDRESS with a port, or the local Speculos.
 */
export function knownSpeculosAddress(configured: string | undefined, port: number): string {
  const address = configured?.trim();
  if (!address) return `http://127.0.0.1:${port}`;
  const withScheme = withoutTrailingSlashes(
    address.startsWith("http") ? address : `http://${address}`,
  );
  return /:\d+$/.test(withScheme) ? withScheme : `${withScheme}:${port}`;
}
