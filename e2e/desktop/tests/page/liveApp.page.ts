import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";

export class LiveApp extends AppPage {
  readonly liveAppTitle = this.page.getByTestId("live-app-title");

  @step("Verify live app title contains $0")
  async verifyLiveAppTitle(provider: string) {
    await expect(this.liveAppTitle).toBeVisible();
    await this.softExpect(async soft => {
      await soft(this.liveAppTitle).toContainText(provider, { ignoreCase: true });
    });
  }
}
