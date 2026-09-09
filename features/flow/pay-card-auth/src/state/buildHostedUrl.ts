export function buildHostedUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) {
    throw new Error("buildHostedUrl: no base URL to address the page on");
  }

  const url = new URL(path, baseUrl);

  if (url.protocol !== "https:") {
    throw new Error(`buildHostedUrl: baseUrl must be https, got "${url.protocol}"`);
  }

  return url.toString();
}
