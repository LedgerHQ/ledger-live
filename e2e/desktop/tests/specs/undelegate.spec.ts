import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { delegateTeamOwner } from "@ledgerhq/live-e2e-shared/data/delegateTeamOwner";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";

const suiAccount = new Delegate(Account.SUI_1, "1", "Ledger by P2P.ORG");
// Mina undelegates the whole balance, so the flow carries no amount. A mina delegation is
// all-or-nothing, so one account cannot serve both flows: `Mina 2` stays delegated so this spec
// always has a position to open, while `Mina 1` stays undelegated for the delegate spec.
const minaAccount = new Delegate(Account.MINA_2, "N/A", "Kraken");

test.describe("Undelegate", () => {
  test.use({
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: suiAccount.account.currency.speculosApp,
    cliCommands: [liveDataCommand(suiAccount.account)],
  });

  test(
    `[${suiAccount.account.currency.testLabel}] - Undelegate`,
    {
      tag: buildTags({ currencyId: suiAccount.account.currency.id, skipLNS: true }),
      annotation: { type: "TMS", description: "B2CQA-387" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(suiAccount.account.accountName);

      await app.undelegate.openFromManageMenu(suiAccount.account.currency.id, 0);
      await app.undelegate.verifyValidatorName(suiAccount.provider);
      await app.undelegate.fillAmount(suiAccount.amount);
      await app.undelegate.verifyPercentageButtonsVisible();
      await app.undelegate.verifyInfoMessage();
      await app.undelegate.continueFromAmount();

      await app.speculos.signDelegationTransaction(suiAccount);
      await app.undelegate.verifySuccessMessage();
      await app.undelegate.clickViewDetailsButton();

      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Undelegated");
      await app.delegateDrawer.amountValueIsVisible(suiAccount.account.currency.ticker);
      await app.drawer.closeDrawer();
    },
  );
});

test.describe("Undelegate", () => {
  test.use({
    teamOwner: delegateTeamOwner(minaAccount.account.currency.id),
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: minaAccount.account.currency.speculosApp,
    cliCommands: [liveDataCommand(minaAccount.account)],
    // Broadcasting would clear the delegation this spec depends on, leaving the next run with no
    // position to open.
    env: { DISABLE_TRANSACTION_BROADCAST: "1" },
  });

  test(
    `[${minaAccount.account.currency.testLabel}] - Undelegate`,
    {
      // The Nano S build of the Mina app stops at 1.4.2 while the other devices ship 1.6.9, the
      // version the delegation flow was validated against.
      tag: buildTags({ currencyId: minaAccount.account.currency.id, skipLNS: true }),
      annotation: { type: "TMS", description: "B2CQA-387" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(minaAccount.account.accountName);

      // Mina holds a single delegation, so its row is not indexed, and undelegating returns the
      // whole balance: the manage menu goes straight to the device, with no amount step.
      await app.undelegate.openFromManageMenu(minaAccount.account.currency.id);

      await app.speculos.signDelegationTransaction(minaAccount);
      await app.undelegate.verifySuccessMessage();
      // Both mina staking flows share a single confirmation step, whose CTA is the generic one.
      await app.delegate.clickViewDetailsButton();

      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Undelegated");
      await app.drawer.closeDrawer();
    },
  );
});
