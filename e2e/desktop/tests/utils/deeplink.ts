import { Page } from "@playwright/test";

export function sendDeepLink(page: Page, link: string) {
  return page.evaluate(l => {
    const { ipcRenderer } = require("electron");
    ipcRenderer.send("deep-linking", l);
  }, link);
}
