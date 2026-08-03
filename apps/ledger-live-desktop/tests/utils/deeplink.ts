import { Page } from "@playwright/test";

export function sendDeepLink(page: Page, link: string) {
  // Runs in the renderer, which has no `require` under contextIsolation: the preload bridge
  // exposes the same `deep-linking` channel as `window.lld.deeplink.open`.
  return page.evaluate(l => window.lld.deeplink.open(l), link);
}
