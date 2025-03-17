import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";

export class LiveApp extends AppPage {
  readonly liveAppTitle = this.page.getByTestId("live-app-title");

  @step("Verify live app title contains $0")
  async verifyLiveAppTitle(provider: string) {
    const liveApp = await this.liveAppTitle.textContent();
    expect(liveApp?.toLowerCase()).toContain(provider);
  }
}
