import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { getEnv } from "@shared/env";
import { addBugLink, addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";

function setupEnv(disableBroadcast?: boolean) {
  test.use({
    env: disableBroadcast ? { DISABLE_TRANSACTION_BROADCAST: "1" } : {},
  });
}

const e2eDelegationAccounts = [
  {
    delegate: new Delegate(Account.ATOM_1, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2740, B2CQA-2770",
    transactionType: "Delegated",
  },
  {
    delegate: new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2741",
    transactionType: "Staked",
  },
  {
    // on-chain validator moniker still reads "Ledger by Chorus One"; flip back to "Ledger by Bitwise" once renamed on-chain
    delegate: new Delegate(Account.INJ_1, "0.0000001", "Ledger by Chorus One"),
    xrayTicket: "B2CQA-3021",
    transactionType: "Delegated",
    requiresExpertMode: true,
  },
  {
    delegate: new Delegate(Account.OSMO_1, "0.0001", "Ledger by Figment"),
    xrayTicket: "B2CQA-3022",
    transactionType: "Delegated",
    bugTicket: "NAPPS-1357",
  },
  {
    delegate: new Delegate(Account.SUI_1, "1", "Ledger by P2P.ORG"),
    xrayTicket: "B2CQA-6115",
    transactionType: "Delegated",
    supportsLNS: false,
  },
];

const validators = [
  {
    delegate: new Delegate(Account.ATOM_2, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2731, B2CQA-2763",
  },
  {
    delegate: new Delegate(Account.SOL_3, "0.001", "Ledger by Figment"),
    xrayTicket: "B2CQA-2764",
  },
  {
    delegate: new Delegate(Account.NEAR_2, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2732, B2CQA-2765",
  },
  {
    delegate: new Delegate(Account.ADA_2, "0.01", "Ledger by Figment"),
    xrayTicket: "B2CQA-2766",
  },
  {
    delegate: new Delegate(Account.MULTIVERS_X_2, "1", "1"),
    xrayTicket: "B2CQA-2767",
  },
  {
    delegate: new Delegate(Account.OSMO_2, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-2768",
    bugTicket: "NAPPS-1357",
  },
];

const liveApps = [
  {
    delegate: new Delegate(Account.TRX_1, "1", "yield.xyz"),
    xrayTicket: "B2CQA-3025",
  },
  {
    delegate: new Delegate(Account.DOT_1, "1", "yield.xyz"),
    xrayTicket: "B2CQA-3026",
  },
];

for (const account of e2eDelegationAccounts) {
  test.describe("Delegate", () => {
    test.use({
      teamOwner: Team.EARN,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: account.delegate.account.currency.speculosApp,
      cliCommands: [liveDataCommand(account.delegate.account)],
    });

    test(
      `[${account.delegate.account.currency.name}] Delegate`,
      {
        tag: buildTags({
          currencyId: account.delegate.account.currency.id,
          skipLNS: account.supportsLNS === false,
        }),
        annotation: { type: "TMS", description: account.xrayTicket },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        if (account.bugTicket) {
          await addBugLink([account.bugTicket]);
        }

        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(account.delegate.account.accountName);

        if (account.requiresExpertMode) {
          await app.speculos.activateExpertMode();
        }

        await app.account.startStakingFlowFromMainStakeButton();
        await app.delegate.verifyFirstProviderName(account.delegate.provider);
        await app.delegate.continue();
        await app.delegate.fillAmount(account.delegate.amount);
        await app.delegate.continue();

        await app.speculos.signDelegationTransaction(account.delegate);
        await app.delegate.verifySuccessMessage();
        await app.delegate.clickViewDetailsButton();

        await app.drawer.waitForDrawerToBeVisible();
        await app.delegateDrawer.verifyTxTypeIsVisible();
        await app.delegateDrawer.verifyTxTypeIs(account.transactionType);

        await app.delegateDrawer.providerIsVisible(account.delegate);
        await app.delegateDrawer.amountValueIsVisible(account.delegate.account.currency.ticker);
        await app.delegateDrawer.operationTypeIsCorrect(account.transactionType);
        await app.drawer.closeDrawer();

        if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
          await app.layout.syncAccounts();
          await app.account.clickOnLastOperationAndReturnStatus();
          await app.delegateDrawer.expectDelegationInfos(account.delegate);
          await app.delegateDrawer.verifyTxTypeIs(account.transactionType);
          await app.delegateDrawer.operationTypeIsCorrect(account.transactionType);
        }
      },
    );
  });
}

test.describe("Delegate without Broadcasting", () => {
  const account = new Delegate(Account.ADA_1, "0.01", "Ledger by Figment 3");
  setupEnv(true);
  test.use({
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [liveDataCommand(account.account)],
  });

  test(
    `[${account.account.currency.name}] Delegate without broadcasting`,
    {
      tag: buildTags({ currencyId: account.account.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-3023" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);
      await app.account.startStakingFlowFromMainStakeButton();

      await app.delegate.continue();
      await app.delegate.openSearchProviderModal();
      await app.delegate.inputProvider(account.provider);
      await app.delegate.selectProviderByName(account.provider);
      await app.delegate.continue();
      await app.delegate.verifyValidatorName("Ledger by Figment 3 [LBF3]");
      await app.delegate.verifyFeesVisible();
      await app.delegate.continue();

      await app.speculos.signDelegationTransaction(account);
      await app.delegate.verifySuccessMessage();
    },
  );
});

test.describe("Delegate without Broadcasting", () => {
  const account = new Delegate(Account.MULTIVERS_X_1, "1", "Figment");
  setupEnv(true);
  test.use({
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [liveDataCommand(account.account)],
  });

  test(
    `[${account.account.currency.name}] Delegate without broadcasting`,
    {
      tag: buildTags({ currencyId: account.account.currency.id, skipLNS: true }),
      annotation: { type: "TMS", description: "B2CQA-3020" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);
      await app.account.startStakingFlowFromMainStakeButton();

      await app.delegate.continue();
      await app.delegate.inputProvider(account.provider);
      await app.delegate.selectProviderByName(account.provider);
      await app.delegate.continue();
      await app.delegate.fillAmount(account.amount);
      await app.delegate.continue();

      await app.speculos.signDelegationTransaction(account);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();

      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Delegated");
      await app.delegateDrawer.providerIsVisible(account);
      await app.delegateDrawer.amountValueIsVisible(account.account.currency.ticker);
      await app.delegateDrawer.operationTypeIsCorrect("Delegated");
      await app.drawer.closeDrawer();
    },
  );
});

test.describe("Delegate without Broadcasting", () => {
  const account = new Delegate(Account.SOL_2, "1", "Ledger by Figment");
  setupEnv(true);
  test.use({
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [liveDataCommand(account.account)],
  });

  test(
    `[${account.account.currency.name}] Delegate without broadcasting`,
    {
      tag: buildTags({ currencyId: account.account.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-2742" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);
      await app.account.startStakingFlowFromMainStakeButton();

      await app.delegate.selectProviderByName(account.provider);
      await app.delegate.continue();
      await app.delegate.fillAmount(account.amount);
      await app.delegate.continue();

      await app.speculos.signDelegationTransaction(account);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();

      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Delegated");
      await app.delegateDrawer.providerIsVisible(account);
      await app.delegateDrawer.amountValueIsVisible(account.account.currency.ticker);
      await app.delegateDrawer.operationTypeIsCorrect("Delegated");
      await app.drawer.closeDrawer();
    },
  );
});

test.describe("e2e delegation - Celo", () => {
  const account = new Delegate(Account.CELO_1, "0.001", "N/A");
  test.use({
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [liveDataCommand(account.account)],
  });

  test(
    "Celo Delegation",
    {
      tag: buildTags({ currencyId: account.account.currency.id, skipLNS: true }),
      annotation: {
        type: "TMS",
        description: "B2CQA-3042",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await addBugLink(["NAPPS-1128"]);
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);
      await app.account.startStakingFlowFromMainStakeButton();
      await app.delegate.checkCeloManageAssetModal();
      await app.delegate.clickCeloLockButton();
      await app.delegate.fillAmount(account.amount);
      await app.delegate.verifyLockInfoCeloWarning();
      await app.delegate.continue();
      await app.speculos.signDelegationTransaction(account);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();
      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Locked");
      await app.delegateDrawer.providerIsVisible(account);
      await app.delegateDrawer.operationTypeIsCorrect("Locked");
      await app.drawer.closeDrawer();
    },
  );

  test(
    "Celo Vote",
    {
      tag: buildTags({ currencyId: account.account.currency.id, skipLNS: true }),
      annotation: {
        type: "TMS",
        description: "B2CQA-201",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await addBugLink(["NAPPS-1128"]);
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);
      await app.account.startStakingFlowFromMainStakeButton();
      await app.delegate.checkCeloManageAssetModal();
      await app.delegate.clickCeloVoteButton();
      await app.delegate.selectProviderOnRow(1);
      await app.delegate.continue();
      await app.delegate.fillAmount(account.amount);
      await app.delegate.continue();
      await app.speculos.signDelegationTransaction(account);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();
      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Voted");
      await app.delegateDrawer.providerIsVisible(account);
      await app.delegateDrawer.operationTypeIsCorrect("Voted");
      await app.drawer.closeDrawer();
    },
  );
});

for (const validator of validators) {
  test.describe("Select a validator", () => {
    test.use({
      teamOwner: Team.EARN,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: validator.delegate.account.currency.speculosApp,
      cliCommands: [liveDataCommand(validator.delegate.account)],
    });

    test(
      `[${validator.delegate.account.currency.name}] - Select validator`,
      {
        tag: buildTags({
          currencyId: validator.delegate.account.currency.id,
          skipLNS: validator.delegate.account.currency.id === Currency.MULTIVERS_X.id,
        }),
        annotation: { type: "TMS", description: validator.xrayTicket },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        if (validator.bugTicket) {
          await addBugLink([validator.bugTicket]);
        }

        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(validator.delegate.account.accountName);

        await app.account.startStakingFlowFromMainStakeButton();
        await app.delegate.continue();

        if (validator.delegate.account.currency.name == Currency.MULTIVERS_X.name) {
          await app.delegate.verifyContinueDisabled();
          await app.delegate.checkValidatorListIsVisible();
          await app.delegate.selectProviderOnRow(Number.parseInt(validator.delegate.provider, 10));
          await app.delegate.closeProviderList(Number.parseInt(validator.delegate.provider, 10));
        } else if (validator.delegate.account.currency.name == Currency.SOL.name) {
          await app.delegate.verifyContinueDisabled();
          await app.delegate.selectProviderByName(validator.delegate.provider);
          await app.delegate.verifyProviderTC(validator.delegate.provider);
        } else {
          await app.delegate.verifyFirstProviderName(validator.delegate.provider);
          await app.delegate.verifyContinueEnabled();
        }
        await app.delegate.verifyProvider(1);
        await app.delegate.openSearchProviderModal();
        await app.delegate.checkValidatorListIsVisible();
        await app.delegate.selectProviderOnRow(2);
        await app.delegate.closeProviderList(2);
      },
    );
  });
}

test.describe("Staking flow from different entry point", () => {
  // on-chain validator moniker still reads "Ledger by Chorus One"; flip back to "Ledger by Bitwise" once renamed on-chain
  const delegateAccount = new Delegate(Account.ATOM_1, "0.001", "Ledger by Chorus One");
  test.use({
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: delegateAccount.account.currency.speculosApp,
    cliCommands: [liveDataCommand(delegateAccount.account)],
  });

  test(
    "Staking flow from market entry point",
    {
      tag: buildTags({ currencyId: delegateAccount.account.currency.id }),
      annotation: {
        type: "TMS",
        description: "B2CQA-2771, B2CQA-3289",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.marketBanner.clickExploreMarketHeader();
      // The asset-discoverability Market has no search input and no per-row stake CTA: staking is
      // reached by opening the asset detail page. Both entry points open the same stake flow.
      if (await app.market.isLegacyMarketList()) {
        await app.market.search(delegateAccount.account.currency.ticker);
        await app.market.stakeButtonClick(delegateAccount.account.currency.ticker);
      } else {
        await app.market.openCoinPage(delegateAccount.account.currency.ticker);
        await app.assetDetail(delegateAccount.account.currency.id).startEarnFlow();
      }

      const selector = await getModularSelector(app, "ACCOUNT");
      if (selector) {
        await selector.selectAccount(delegateAccount.account);
      } else {
        await app.assetDrawer.selectAccountByIndex(delegateAccount.account);
      }

      await app.delegate.verifyFirstProviderName(delegateAccount.provider);
      await app.delegate.continue();
    },
  );
});

for (const currency of liveApps) {
  test.describe("LiveApp delegate", () => {
    test.use({
      teamOwner: Team.EARN,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: currency.delegate.account.currency.speculosApp,
      cliCommands: [liveDataCommand(currency.delegate.account)],
    });

    test(
      `[${currency.delegate.account.currency.name}] - Select validator`,
      {
        tag: buildTags({ currencyId: currency.delegate.account.currency.id }),
        annotation: { type: "TMS", description: currency.xrayTicket },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(currency.delegate.account.accountName);

        await app.account.startStakingFlowFromMainStakeButton();
        await app.liveApp.verifyLiveAppTitle(currency.delegate.provider);
      },
    );
  });
}
