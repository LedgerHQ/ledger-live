import { Page } from "@playwright/test";

export function sendDeepLink(page: Page, link: string) {
  return page.evaluate(l => window.lld.deeplink.open(l), link);
}
