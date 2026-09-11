import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { delegateTeamOwner } from "@ledgerhq/live-e2e-shared/data/delegateTeamOwner";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  MINA_DELEGATION_PAIR,
  pickMinaAccountToUndelegate,
} from "@ledgerhq/live-e2e-shared/families/minaStakingState";
import { buildTags } from "tests/utils/tagsUtils";

const suiAccount = new Delegate(Account.SUI_1, "1", "Ledger by P2P.ORG");

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

test.describe("Undelegate - MINA", () => {
  test.slow();

  // Broadcasting is left to the nightly policy: this flow frees the delegated account of the pair,
  // which the delegate flow stakes back.
  test.use({
    teamOwner: delegateTeamOwner(Currency.MINA.id),
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: Currency.MINA.speculosApp,
    // Either account of the pair can be the delegated one, so both are seeded.
    cliCommands: MINA_DELEGATION_PAIR.map(account => liveDataCommand(account)),
  });

  test(
    `[${Currency.MINA.testLabel}] - Undelegate`,
    {
      // The Nano S build of the Mina app stops at 1.4.2, before the delegation flow.
      tag: buildTags({ currencyId: Currency.MINA.id, skipLNS: true }),
      annotation: { type: "TMS", description: "B2CQA-387" },
    },
    async ({ app }) => {
      // Undelegating delegates back to the account itself, and the device review renders that raw
      // address: the speculos helper asserts against it, hence no target validator here.
      const account = await pickMinaAccountToUndelegate();
      const delegation = new Delegate(account, "N/A", "N/A");

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.accountName);

      await app.layout.waitForSyncButtonToBeEnabled({ slowSync: true });
      // Mina holds a single delegation, so its row is not indexed.
      await app.undelegate.openFromManageMenu(Currency.MINA.id);

      await app.speculos.signDelegationTransaction(delegation);
      await app.undelegate.verifySuccessMessage();
      // Both mina staking flows share a single confirmation step, whose CTA is the generic one.
      await app.delegate.clickViewDetailsButton();

      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Undelegated");
      await app.delegateDrawer.verifyAccountName(account.accountName);
      // Undelegating moves no value either: the drawer amount is the fee.
      await app.delegateDrawer.amountValueIsVisible(Currency.MINA.ticker);
      await app.drawer.closeDrawer();
    },
  );
});
