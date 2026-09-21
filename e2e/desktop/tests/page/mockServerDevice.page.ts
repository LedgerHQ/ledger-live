import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { MockServerSessionHandle } from "@ledgerhq/live-e2e-shared/mockServer/session";

const sorted = (appNames: string[]) => [...appNames].sort();

export class MockServerDevicePage extends MockServerSessionHandle {
  @step("Expect the device to report the apps $0 installed")
  async expectInstalledApps(appNames: string[], timeout = 30_000) {
    await expect
      .poll(async () => sorted(await this.installedApps()), { timeout })
      .toEqual(sorted(appNames));
  }
}
