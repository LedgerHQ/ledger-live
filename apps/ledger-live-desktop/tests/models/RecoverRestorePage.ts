import { Page, Locator } from "@playwright/test";
import { sendDeepLink } from "../utils/deeplink";

export class RecoverRestorePage {
  readonly page: Page;
  readonly connectText: Locator;
  readonly deepLink = "ledgerlive://recover-restore-flow";

  constructor(page: Page) {
    this.page = page;
    this.connectText = page.locator("data-test-id=recover-restore-connect-text");
  }

  useDeepLink() {
    return sendDeepLink(this.page, this.deepLink);
  }
}
