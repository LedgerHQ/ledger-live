export function buildHostedPageUrl(baseUrl: string, pageUrl: string): string {
  const page = new URL(pageUrl);
  const url = new URL(`${page.pathname}${page.search}`, baseUrl);

  if (url.protocol !== "https:") {
    throw new Error(`buildHostedPageUrl: baseUrl must be https, got "${url.protocol}"`);
  }

  return url.toString();
}
