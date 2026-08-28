import { type CliCommand, test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { LedgerSyncCliHelper } from "@ledgerhq/live-e2e-shared/ledgerSync/helper";
import { ledgerSyncEnvironment } from "@ledgerhq/live-e2e-shared/ledgerSync/environment";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { ethAccount, secondEthAccount } from "@ledgerhq/live-e2e-shared/ledgerSync/testData";
import {
  addTrustchainMember,
  destroyTrustchain,
  generateLedgerSyncSeed,
  initializeEmptyTrustchain,
  pushAccountsToTrustchain,
} from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
import { deviceTagsWithoutLNS } from "tests/utils/tagsUtils";

const APP_INSTANCE_NAME = "LWD";

function setupSeed() {
  // Restore through process.env, not setEnv: startSpeculos reads process.env.SEED directly, so a
  // setEnv restore leaves the generated seed in place for whatever runs next in this worker.
  let previousSeed: string | undefined;
  test.beforeAll(async () => {
    previousSeed = process.env.SEED;
    process.env.SEED = generateLedgerSyncSeed();
  });
  test.afterAll(async () => {
    if (previousSeed === undefined) delete process.env.SEED;
    else process.env.SEED = previousSeed;
  });
}

function destroyTrustchainAfterAll() {
  test.afterAll(destroyTrustchain);
}

function preSeededTrustchain(seedCommands: CliCommand[] = []) {
  return {
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: AppInfos.LS,
    cliCommands: [
      ...initializeEmptyTrustchain(),
      ...seedCommands,
      LedgerSyncCliHelper.saveTrustchainToUserdata,
    ],
    featureFlags: {
      lldWalletSync: {
        enabled: true,
        params: {
          environment: ledgerSyncEnvironment,
          watchConfig: {
            pollingInterval: 2_000,
            initialTimeout: 500,
          },
          learnMoreLink: "",
        },
      },
      lldLedgerSyncEntryPoints: { enabled: true },
    },
  };
}

test.describe("Ledger Sync - add account", () => {
  setupSeed();
  destroyTrustchainAfterAll();
  const addedCurrency = Currency.ETH;

  test.use(preSeededTrustchain());

  test(
    "[Live Hub][Ledger Sync] Adding New Account (Online)",
    {
      tag: deviceTagsWithoutLNS(),
      annotation: {
        type: "TMS",
        description: "B2CQA-2303",
      },
    },
    async ({ app, speculos }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await speculos.relaunch(addedCurrency.speculosApp.name);

      await app.portfolio.expectAddAccountButtonVisible();
      await app.trustchain.expectToBeEmpty();

      await app.portfolio.clickAddAccountButton();

      const selector = await getModularSelector(app, "ASSET");
      if (selector) {
        await selector.validateItems();
        await selector.selectAssetByTicker(addedCurrency);
        await selector.selectNetwork(addedCurrency);
        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickCloseButton();
      } else {
        await app.addAccount.expectModalVisibility();
        await app.addAccount.selectCurrency(addedCurrency);
        await app.addAccount.addAccounts();
        await app.addAccount.done();
      }

      await app.accounts.expectReduxAccountsLength(1);
      const [addedAccountId] = await app.accounts.getReduxAccountIds();

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.expectAccountsCount(1, 60_000);
      await app.accounts.expectCryptoAccountRowVisible(`${addedCurrency.name} 1`);

      await app.layout.syncAccountsIfAvailable();

      await app.trustchain.expectToHoldAccount(addedAccountId, addedCurrency.id);
    },
  );
});

test.describe("Ledger Sync - rename account", () => {
  setupSeed();

  destroyTrustchainAfterAll();
  const defaultAccountName = `${Currency.ETH.name} 1`;
  const renamedAccountName = `${Currency.ETH.name} LedgerSync 1`;

  test.use(preSeededTrustchain([pushAccountsToTrustchain([ethAccount])]));

  test(
    "[Live Hub][Ledger Sync] Renaming Account (Online)",
    {
      tag: deviceTagsWithoutLNS(),
      annotation: {
        type: "TMS",
        description: "B2CQA-2302",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.accounts.expectReduxAccountIds([ethAccount.id]);
      await app.trustchain.expectAccountToHaveDefaultName(ethAccount.id);

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.expectAccountsCount(1, 60_000);
      await app.accounts.expectCryptoAccountRowVisible(defaultAccountName);

      await app.accounts.navigateToAccountByName(defaultAccountName);
      await app.account.expectAccountVisibility(defaultAccountName);
      await app.account.renameAccount(renamedAccountName);
      await app.account.expectAccountVisibility(renamedAccountName);

      await app.layout.syncAccountsIfAvailable();

      await app.trustchain.expectAccountName(ethAccount.id, renamedAccountName);
    },
  );
});

test.describe("Ledger Sync - delete account", () => {
  setupSeed();

  destroyTrustchainAfterAll();
  const deletedAccountName = `${Currency.ETH.name} 1`;
  const remainingAccountName = `${Currency.ETH.name} 2`;

  test.use(preSeededTrustchain([pushAccountsToTrustchain([ethAccount, secondEthAccount])]));

  test(
    "[Live Hub][Ledger Sync] Deleting Account (Online)",
    {
      tag: deviceTagsWithoutLNS(),
      annotation: {
        type: "TMS",
        description: "B2CQA-2300",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.accounts.expectReduxAccountIds([ethAccount.id, secondEthAccount.id]);
      await app.trustchain.expectAccountIds([ethAccount.id, secondEthAccount.id]);

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.expectAccountsCount(2, 60_000);
      await app.accounts.expectCryptoAccountRowVisible(deletedAccountName);
      await app.accounts.expectCryptoAccountRowVisible(remainingAccountName);

      await app.accounts.navigateToAccountByName(deletedAccountName);
      await app.account.expectAccountVisibility(deletedAccountName);
      await app.account.deleteAccount();
      await app.accounts.expectAccountAbsence(deletedAccountName);
      await app.accounts.expectReduxAccountIds([secondEthAccount.id]);

      await app.layout.syncAccountsIfAvailable();

      await app.trustchain.expectAccountIds([secondEthAccount.id]);
    },
  );
});

test.describe("Ledger Sync - delete instance", () => {
  setupSeed();

  destroyTrustchainAfterAll();

  test.use(preSeededTrustchain([addTrustchainMember(APP_INSTANCE_NAME)]));

  test(
    "[Live Hub][Ledger Sync] Delete instance",
    {
      tag: deviceTagsWithoutLNS(),
      annotation: {
        type: "TMS",
        description: "B2CQA-2297",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.manageInstances();
      await app.ledgerSync.expectCLIMemberVisible();

      await app.ledgerSync.removeCLIMember();
      await app.speculos.removeMemberFromLedgerSync();
      await app.ledgerSync.expectMemberRemoval();
      await app.ledgerSync.expectCLIMemberRemoved();
      await app.drawer.closeDrawer();

      await app.settings.openManageLedgerSync();
      await app.ledgerSync.manageInstances();
      await app.ledgerSync.expectCLIMemberRemoved();
      await app.drawer.closeDrawer();
    },
  );
});

test.describe("Ledger Sync - delete backup", () => {
  setupSeed();

  destroyTrustchainAfterAll();

  test.use(preSeededTrustchain([pushAccountsToTrustchain([ethAccount])]));

  test(
    "[Live Hub][Ledger Sync] Delete backup",
    {
      tag: deviceTagsWithoutLNS(),
      annotation: {
        type: "TMS",
        description: "B2CQA-2296",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.trustchain.expectToHoldAccount(ethAccount.id, ethAccount.currencyId);

      await app.mainNavigation.openSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.expectLedgerSyncManagementVisible();

      await app.ledgerSync.destroyTrustchain();
      await app.ledgerSync.expectBackupDeletion();
      await app.drawer.closeDrawer();

      await app.settings.expectLedgerSyncSettingsEntryPoint();
      await app.trustchain.expectToBeDestroyed();
    },
  );
});

function unactivatedFeatureFlags() {
  return {
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    featureFlags: {
      lldWalletSync: {
        enabled: true,
        params: {
          environment: ledgerSyncEnvironment,
          watchConfig: {
            pollingInterval: 2_000,
            initialTimeout: 500,
          },
          learnMoreLink: "",
        },
      },
      lldLedgerSyncEntryPoints: {
        enabled: true,
        params: {
          manager: true,
          accounts: true,
          settings: true,
          onboarding: true,
          postOnboarding: true,
          sendFlow: false,
        },
      },
      lwdLedgerSyncOptimisation: { enabled: true },
    },
  };
}

test.describe("Ledger Sync - entry point in settings", () => {
  test.use(unactivatedFeatureFlags());

  test(
    "[WXP][Ledger Sync] A wallet sync entry point should exist in the settings",
    {
      tag: [...deviceTagsWithoutLNS(), "@wallet-xp"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2292",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      await app.settings.expectLedgerSyncSettingsRow();
      await app.settings.expectLedgerSyncSettingsEntryPoint();
    },
  );
});

test.describe("Ledger Sync - activation flow no backup activated", () => {
  test.use(unactivatedFeatureFlags());

  test(
    "[WXP][Ledger Sync] Activation Flow - No Backup Activated",
    {
      tag: [...deviceTagsWithoutLNS(), "@wallet-xp"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2293",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      await app.settings.expectLedgerSyncSettingsRow();
      await app.settings.expectLedgerSyncSettingsEntryPoint();
      await app.settings.clickSyncLedgerSync();
      await app.ledgerSync.expectActivationScreenVisible();
    },
  );
});

test.describe("Ledger Sync - activation flow backup activated", () => {
  setupSeed();
  destroyTrustchainAfterAll();

  test.use({ ...unactivatedFeatureFlags(), speculosApp: AppInfos.LS });

  test(
    "[WXP][Ledger Sync] Activation Flow - Backup Activated",
    {
      tag: [...deviceTagsWithoutLNS(), "@wallet-xp"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2294",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      await app.settings.expectLedgerSyncSettingsRow();
      await app.settings.expectLedgerSyncSettingsEntryPoint();
      await app.settings.clickSyncLedgerSync();
      await app.ledgerSync.expectActivationScreenVisible();

      await app.ledgerSync.clickTurnOnLedgerSync();
      await app.ledgerSync.clickConnectDevice();
      await app.speculos.activateLedgerSync();
      await app.ledgerSync.expectActivationSuccess();

      await app.drawer.closeDrawer();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.expectLedgerSyncManagementVisible();
      await app.drawer.closeDrawer();
    },
  );
});
