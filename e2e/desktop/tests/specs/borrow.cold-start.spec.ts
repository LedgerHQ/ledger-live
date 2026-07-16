import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  FF_BORROW_DESKTOP,
  FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
} from "tests/utils/featureFlagUtils";

const account = Account.ETH_4;
const family = getFamilyByCurrencyId(account.currency.id);

const tags = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  `@${account.currency.id}`,
  ...(family ? [`@family-${family}`] : []),
];

test.describe("Borrow cold start", () => {
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account)],
    speculosForSetupOnly: true,
    featureFlags: {
      ...FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
      ...FF_BORROW_DESKTOP,
    },
  });

  test(
    "Portfolio entry point opens borrow and shows Introducing Crypto Loan modal",
    {
      tag: tags,
      annotation: { type: "TMS", description: "B2CQA-6062" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectBorrowEntryPointVisible();

      await app.borrow.goAndWaitForBorrowToBeReady(async () => {
        await app.portfolio.clickBorrowEntryPoint();
      });

      await app.borrow.verifyIntroModalVisible();
    },
  );
});
