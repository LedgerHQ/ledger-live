import { buildHostedUrl } from "./buildHostedUrl";

export function buildHostedPageUrl(baseUrl: string, pageUrl: string): string {
  const page = new URL(pageUrl);

  return buildHostedUrl(baseUrl, `${page.pathname}${page.search}`);
}
