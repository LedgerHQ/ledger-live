import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";

const account = new Delegate(Account.SUI_1, "1", "Ledger by P2P.ORG");

test.use({
  teamOwner: Team.EARN,
  userdata: "skip-onboarding-with-last-seen-device",
  speculosApp: account.account.currency.speculosApp,
  cliCommands: [liveDataCommand(account.account)],
});

test.describe("Undelegate", () => {
  test(
    `[${account.account.currency.testLabel}] - Undelegate`,
    {
      tag: buildTags({ currencyId: account.account.currency.id, skipLNS: true }),
      annotation: { type: "TMS", description: "B2CQA-387-2" }, // to change
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);

      await app.undelegate.openFromManageMenu();
      await app.undelegate.verifyValidatorName(account.provider);
      await app.undelegate.fillAmount(account.amount);
      await app.undelegate.verifyPercentageButtonsVisible();
      await app.undelegate.verifyInfoMessage();
      await app.undelegate.continueFromAmount();

      await app.speculos.signDelegationTransaction(account);
      await app.undelegate.verifySuccessMessage();
      await app.undelegate.clickViewDetailsButton();

      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Undelegated");
      await app.delegateDrawer.amountValueIsVisible(account.account.currency.ticker);
      await app.drawer.closeDrawer();
    },
  );
});
