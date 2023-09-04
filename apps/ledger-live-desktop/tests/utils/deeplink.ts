import { Page } from "@playwright/test";

export function sendDeepLink(page: Page, link: string) {
  return page.evaluate(l => {
    const app = require("@electron/remote");
    const win = app.getCurrentWindow();
    win.send("deep-linking", l);
  }, link);
}
