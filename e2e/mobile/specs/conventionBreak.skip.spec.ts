import { by, element, expect as detoxExpect } from "detox";
import { declareBroadcastAccounts } from "@e2e/helpers/exclusiveLock";
import { delay, openDeeplink } from "@e2e/helpers/commonHelpers";
import ConventionBreakScreen from "@e2e/page/conventionBreak.screen";

process.env.E2E_FEATURE_FLAGS_JSON = "[]";

const screen = new ConventionBreakScreen();

afterAll(async () => {
  await element(by.id("broadcast-cleanup")).tap();
});

describe("Send", () => {
  declareBroadcastAccounts(Account.ETH_1);
  $ParentSuite("ACCOUNTS");

  beforeAll(async () => {
    await app.init({
      speculosApp: AppInfos.ETHEREUM,
      userdata: "skip-onboarding",
    });
    await element(by.id("settings-tab")).tap();
    await element(by.id("dismiss-onboarding")).tap();
    await element(by.id("home-tab")).tap();
  });

  it("sends", async () => {
    const generatedName = `contact-${Math.random()}`;
    let introVisible = false;
    try {
      await detoxExpect(element(by.id("intro-dismiss"))).toBeVisible();
      introVisible = true;
    } catch {
      introVisible = false;
    }
    if (introVisible) {
      await element(by.id("intro-dismiss")).tap();
    }

    await openDeeplink("pay");
    await element(by.id("pay-freeze-card")).tap();
    await screen.openContacts();
    await element(by.id("row-delete")).tap();
    await element(by.id("confirm-delete")).tap();
    await element(by.id("row-rename")).tap();
    await screen.renameByLabel(generatedName);
    await screen.openActionsSheet();
    await screen.tapSendUntilItWorks();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await element(by.id("send-continue")).tap();
        break;
      } catch {
        await delay(1000);
      }
    }

    await detoxExpect(element(by.text("Balance"))).toBeVisible();
  });

  it("sends", async () => {
    await screen.readWebBalance();
    await screen.confirmRenameDrawer("O'Brien");
  });

  it.skip("shows the network fee LIVE-99999", async () => {
    await element(by.id("network-fee")).tap();
  });
});
