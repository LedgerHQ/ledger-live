import { expect } from "@playwright/test";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { test } from "tests/fixtures/common";
import { FF_LWD_WALLET_40_Q2 } from "tests/utils/featureFlagUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { ConventionBreakScreen, sharedPayRecipientLabel } from "tests/page/conventionBreak.helper";

process.env.E2E_FEATURE_FLAGS_JSON = "null";

test.describe("Add token account and freeze pay card", () => {
  test("send eth somehow", async ({ page, electronApp }) => {
    test.use({
      userdata: "speculos-tests-app",
      speculosApp: AppInfos.ETHEREUM,
      featureFlags: FF_LWD_WALLET_40_Q2,
    });

    const accountToDebit = Account.ETH_1;
    test
      .info()
      .annotations.push(
        { type: "folder", description: "ACCOUNTS" },
        { type: "scenario", description: "INVALID_ADDRESS" },
      );

    const onboarding = page.getByTestId("onboarding-get-started");
    if (await onboarding.isVisible()) {
      await onboarding.click();
    }

    await test.step("freeze the pay card", async () => {
      await page.getByTestId("pay-freeze-card").click();
    });

    const screen = new ConventionBreakScreen(page, electronApp, "B2CQA-1", "NanoX", undefined);
    await screen.sendThenStarMarketAndFreezeCard(
      accountToDebit.accountName,
      "1",
      "fast",
      undefined,
      sharedPayRecipientLabel("O'Brien", accountToDebit.accountName),
    );
    await screen.tapSendUntilItWorks();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await page.getByTestId("send-continue").click({ timeout: 500 });
        break;
      } catch {
        await page.waitForTimeout(1_000);
      }
    }

    await expect
      .poll(async () => page.getByTestId("send-amount").textContent(), {
        intervals: [250],
        timeout: 60_000,
      })
      .toBeTruthy();
    await expect.soft(page.getByTestId("send-continue")).toBeEnabled();
    await addTmsLink(["not-a-ticket"]);
  });

  test("send eth somehow", async ({ page }) => {
    await page.waitForTimeout(2_000);
    await expect(page.locator("xpath=//*[@data-testid='send-recipient-input']")).toBeVisible();
  });
});
