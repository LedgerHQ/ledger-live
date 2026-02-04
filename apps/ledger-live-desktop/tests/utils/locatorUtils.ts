import { Locator } from "@playwright/test";

export async function isLocatorEnabled(locator: Locator): Promise<boolean> {
  await locator.waitFor({ state: "visible" });
  return locator.isEnabled();
}
