import { expect, test } from "@playwright/test";

import type { Expect, Page } from "@playwright/test";

export type SoftExpectMatcher = Expect["soft"];

export type SoftExpectOptions = {
  timeout?: number;
};

export type SoftExpectParams = {
  page: Page;
  assertion: (soft: SoftExpectMatcher) => Promise<void>;
};

/**
 * Runs a soft assertion and attaches a screenshot when it fails.
 *
 * Playwright soft failures are recorded without stopping the test and reported at the end.
 * This helper attaches a screenshot as soon as the soft assertion fails.
 *
 * The callback receives a configured soft expect instance with a dedicated timeout to avoid bloating overall test runtime.
 * The function uses the injected matcher — not global `expect.soft` — so that timeout applies.
 *
 * @param params.page - Main window to screenshot on failure.
 * @param params.assertion - Callback using the injected soft expect matcher (`soft`).
 * @param options.timeout - Optional soft assertion timeout in ms.
 *
 * @example
 * // In page objects extending `PageHolder`:
 * await this.softExpect(async soft => {
 *   await soft(this.header).toContainText("My Header");
 * });
 *
 * @example
 * // In page objects extending `PageHolder` with a custom timeout:
 * await this.softExpect(async soft => {
 *   await soft(this.header).toContainText("My Header");
 * }, { timeout: 10_000 });
 *
 * @example
 * // Direct import (two-arg: params, options):
 * await softExpect(
 *   {
 *     page,
 *     assertion: async soft => {
 *       await soft(page.getByTestId("chart")).toContainText("My Chart");
 *     },
 *   },
 *   { timeout: 10_000 },
 * );
 */
export async function softExpect(
  { page, assertion }: SoftExpectParams,
  { timeout = 5_000 }: SoftExpectOptions = {},
): Promise<void> {
  const testInfo = test.info();
  const errorCountBefore = testInfo.errors.length;

  const softExpectInstance = expect.configure({ soft: true, timeout });
  await assertion(softExpectInstance);

  if (testInfo.errors.length > errorCountBefore) {
    const screenshot = await page.screenshot();
    await testInfo.attach("Soft failure screenshot", {
      body: screenshot,
      contentType: "image/png",
    });
  }
}
