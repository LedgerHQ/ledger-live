import { type CliCommand, test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { LedgerSyncCliHelper, ledgerSyncEnvironment } from "tests/utils/ledgerSyncCliUtils";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { ethAccount, secondEthAccount } from "tests/testdata/ledgerSyncTestData";
import { getEnv, setEnv } from "@shared/env";
import { deviceTagsWithoutLNS } from "tests/utils/tagsUtils";

const APP_INSTANCE_NAME = "LWD";

function setupSeed(seed: string) {
  const prevSeed = getEnv("SEED");
  test.beforeAll(async () => {
    process.env.SEED = seed;
  });
  test.afterAll(async () => {
    setEnv("SEED", prevSeed);
  });
}

/** Clears whatever the previous run left on the backend before building the real trustchain. */
function initializeThenDeleteTrustchain() {
  return [
    LedgerSyncCliHelper.initializeLedgerKeyRingProtocol,
    LedgerSyncCliHelper.initializeLedgerSync,
    LedgerSyncCliHelper.deleteLedgerSyncData,
  ];
}

function initializeEmptyTrustchain() {
  return [
    LedgerSyncCliHelper.initializeLedgerKeyRingProtocol,
    LedgerSyncCliHelper.initializeLedgerSync,
  ];
}

function pushEthAccountToTrustchain() {
  return LedgerSyncCliHelper.pushAccountsToTrustchain([ethAccount]);
}

/** Registers the app under its own instance name, so the CLI stays a separate instance. */
function addAppInstanceToTrustchain() {
  return LedgerSyncCliHelper.addTrustchainMember(APP_INSTANCE_NAME);
}

function pushTwoEthAccountsToTrustchain() {
  return LedgerSyncCliHelper.pushAccountsToTrustchain([ethAccount, secondEthAccount]);
}

function destroyTrustchainAfterAll() {
  test.afterAll(async () => {
    const { pubKey } = LedgerSyncCliHelper.ledgerKeyRingProtocolArgs;
    const { rootId } = LedgerSyncCliHelper.ledgerSyncPushDataArgs;
    if (!pubKey || !rootId) return;

    try {
      await LedgerSyncCliHelper.deleteLedgerSyncData();
    } catch (error) {
      console.error(`[E2E] Ledger Sync cleanup failed for trustchain ${rootId}:`, error);
    }
  });
}

/**
 * Options for a test that boots the app already a member of a freshly created trustchain.
 * `seedCommands` run once the trustchain exists and before it is written to the userdata.
 */
function preSeededTrustchain(seedCommands: CliCommand[] = []) {
  return {
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: AppInfos.LS,
    cliCommands: [
      ...initializeThenDeleteTrustchain(),
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
  setupSeed("LS_AddAccount_SEED");
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
      await app.layout.waitForAccountsSyncToBeDone();

      await app.trustchain.expectToHoldAccount(addedAccountId, addedCurrency.id);
    },
  );
});

test.describe("Ledger Sync - rename account", () => {
  setupSeed("LS_RenameAccount_SEED");
  destroyTrustchainAfterAll();
  const defaultAccountName = `${Currency.ETH.name} 1`;
  const renamedAccountName = `${Currency.ETH.name} LedgerSync 1`;

  test.use(preSeededTrustchain([pushEthAccountToTrustchain]));

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
      await app.layout.waitForAccountsSyncToBeDone();

      await app.trustchain.expectAccountName(ethAccount.id, renamedAccountName);
    },
  );
});

test.describe("Ledger Sync - delete account", () => {
  setupSeed("LS_DeleteAccount_SEED");
  destroyTrustchainAfterAll();
  const deletedAccountName = `${Currency.ETH.name} 1`;
  const remainingAccountName = `${Currency.ETH.name} 2`;

  test.use(preSeededTrustchain([pushTwoEthAccountsToTrustchain]));

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
      await app.layout.waitForAccountsSyncToBeDone();

      await app.trustchain.expectAccountIds([secondEthAccount.id]);
    },
  );
});

test.describe("Ledger Sync - delete instance", () => {
  setupSeed("LS_DeleteInstance_SEED");
  destroyTrustchainAfterAll();

  test.use(preSeededTrustchain([addAppInstanceToTrustchain]));

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
