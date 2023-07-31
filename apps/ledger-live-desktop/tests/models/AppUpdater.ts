import { Page } from "@playwright/test";

export class AppUpdater {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setStatus(s: UpdateStatus) {
    await this.page.evaluate(
      args => {
        [s] = args;
        if (window && window.mock && window.mock.updater && window.mock.updater.setStatus) {
          window?.mock?.updater?.setStatus(s);
        }
      },
      [s],
    );
  }
}
