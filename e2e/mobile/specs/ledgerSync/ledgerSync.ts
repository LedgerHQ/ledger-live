import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { describeIfNotNanoS } from "../../helpers/commonHelpers";
import { ledgerSyncEnvironment } from "@ledgerhq/live-e2e-shared/ledgerSync/environment";
import type { LedgerSyncCliCommand } from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
import { ethAccount, secondEthAccount } from "@ledgerhq/live-e2e-shared/ledgerSync/testData";

const APP_INSTANCE_NAME = "LWM";
const defaultAccountName = `${Currency.ETH.name} 1`;
const secondAccountName = `${Currency.ETH.name} 2`;
const renamedAccountName = `${Currency.ETH.name} LedgerSync 1`;

const ledgerSyncFeatureFlags = {
  llmWalletSync: {
    enabled: true,
    params: {
      environment: ledgerSyncEnvironment,
      watchConfig: {},
      learnMoreLink: "",
    },
  },
};

/**
 * The app builds its trustchain SDK on first render and keeps it in a module singleton, so the
 * environment it boots with is the only one it will ever use — an override sent to a running app
 * moves the flag but not the SDK. Pointing the CLI elsewhere would leave the two on different
 * backends and surface as an empty trustchain rather than an error, so refuse it up front.
 */
function assertSupportedEnvironment() {
  if (ledgerSyncEnvironment !== "STAGING") {
    throw new Error(
      `Ledger Sync: mobile can only run against STAGING, got ${ledgerSyncEnvironment}. ` +
        "The app pins its trustchain SDK at boot, so LEDGER_SYNC_ENVIRONMENT cannot move it.",
    );
  }
}

/**
 * A seed per run, so every suite builds its trustchain from scratch instead of clearing whatever
 * the previous run left on the backend, and so no test ever derives accounts from the shared seed.
 */
function setupSeed() {
  let previousSeed: string | undefined;
  beforeAll(() => {
    assertSupportedEnvironment();
    previousSeed = app.ledgerSync.useGeneratedSeed();
  });
  afterAll(() => {
    app.ledgerSync.restoreSeed(previousSeed);
  });
}

/**
 * A generated seed makes the trustchain unreachable once the run ends, so this is what keeps the
 * backend from accumulating orphans. `app.init` never releases its Speculos either, so the device
 * has to be freed here or instances pile up until the file-level teardown.
 */
function cleanupAfterAll() {
  afterAll(async () => {
    await app.ledgerSync.destroyTrustchain();
    await app.common.removeSpeculos();
  });
}

/** Boots the app already a member of a freshly created trustchain, skipping the activation UI. */
async function initPreSeeded(seedCommands: LedgerSyncCliCommand[] = []) {
  await app.init({
    speculosApp: AppInfos.LS,
    featureFlags: ledgerSyncFeatureFlags,
    cliCommands: [
      ...app.ledgerSync.initializeEmptyTrustchain(),
      ...seedCommands,
      userdataPath => app.ledgerSync.saveTrustchainToUserdata(userdataPath),
    ],
  });
  await app.mainNavigation.waitForWallet40Ready();
}

async function openLedgerSyncSettings() {
  await app.mainNavigation.openPortfolioViaDeeplink();
  await app.mainNavigation.navigateToSettings();
  await app.settings.navigateToGeneralSettings();
  await app.settingsGeneral.navigateToLedgerSync();
}

export function runLedgerSyncAddAccountTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.WALLET_XP);
  describeIfNotNanoS("Ledger Sync - add account", () => {
    setupSeed();
    cleanupAfterAll();

    beforeAll(async () => {
      // The CLI needs the LedgerSync app to create the trustchain and the phone needs Ethereum to
      // add the account: mobile launches both in parallel rather than relaunching one device.
      await app.init({
        speculosApp: Currency.ETH.speculosApp,
        featureFlags: ledgerSyncFeatureFlags,
        cliCommandsOnApp: app.ledgerSync
          .initializeEmptyTrustchain()
          .map(cmd => ({ app: AppInfos.LS, cmd })),
        cliCommands: [userdataPath => app.ledgerSync.saveTrustchainToUserdata(userdataPath)],
      });
      await app.mainNavigation.waitForWallet40Ready();
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Adding a new account propagates it to the trustchain", async () => {
      await app.trustchain.expectToBeEmpty();

      await app.portfolio.addAccount();
      await app.addAccount.importWithYourLedgerIfAsked();
      await app.modularDrawer.performSearchByTicker(Currency.ETH.ticker);
      await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
      await app.modularDrawer.selectNetworkIfAsked(Currency.ETH.name);

      const accountId = await app.addAccount.addAccountAtIndex(defaultAccountName, Currency.ETH.id);
      await app.addAccount.tapCloseAddAccountCta();

      await app.trustchain.expectToHoldAccount(accountId, Currency.ETH.id);
    });
  });
}

export function runLedgerSyncRenameAccountTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.WALLET_XP);
  describeIfNotNanoS("Ledger Sync - rename account", () => {
    setupSeed();
    cleanupAfterAll();

    beforeAll(async () => {
      await initPreSeeded([app.ledgerSync.pushAccountsToTrustchain([ethAccount])]);
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Renaming an account propagates the new name to the trustchain", async () => {
      await app.trustchain.expectAccountToHaveDefaultName(ethAccount.id);

      await app.accounts.openViaDeeplink();
      await app.accounts.expectAccountsNumber(1, app.ledgerSync.ledgerSyncPushDataArgs.data);

      await app.common.goToAccountByName(defaultAccountName);
      await app.account.openAccountSettings();
      await app.account.selectAccountRename();
      await app.account.enterNewAccountName(renamedAccountName);

      await app.accounts.openViaDeeplink();
      await app.common.expectAccountName(renamedAccountName);

      await app.trustchain.expectAccountName(ethAccount.id, renamedAccountName);
    });
  });
}

export function runLedgerSyncDeleteAccountTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.WALLET_XP);
  describeIfNotNanoS("Ledger Sync - delete account", () => {
    setupSeed();
    cleanupAfterAll();

    beforeAll(async () => {
      await initPreSeeded([
        app.ledgerSync.pushAccountsToTrustchain([ethAccount, secondEthAccount]),
      ]);
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Deleting an account removes it from the trustchain", async () => {
      await app.trustchain.expectAccountIds([ethAccount.id, secondEthAccount.id]);

      await app.accounts.openViaDeeplink();
      await app.accounts.expectAccountsNumber(2, app.ledgerSync.ledgerSyncPushDataArgs.data);

      await app.common.goToAccountByName(defaultAccountName);
      await app.account.openAccountSettings();
      await app.account.selectAccountDelete();
      await app.account.confirmAccountDelete();

      await app.accounts.openViaDeeplink();
      await app.common.expectAccountName(secondAccountName);

      await app.trustchain.expectAccountIds([secondEthAccount.id]);
    });
  });
}

export function runLedgerSyncDeleteInstanceTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.WALLET_XP);
  describeIfNotNanoS("Ledger Sync - delete instance", () => {
    setupSeed();
    cleanupAfterAll();

    beforeAll(async () => {
      await initPreSeeded([app.ledgerSync.addTrustchainMember(APP_INSTANCE_NAME)]);
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Removing an instance drops it from the synchronized list", async () => {
      // The app was seeded with the member added last, so the CLI is the other instance — the
      // only one the app will let us remove.
      const cliMemberPubKey = app.ledgerSync.initialMemberPubKey;

      await openLedgerSyncSettings();
      await app.ledgerSync.openManageInstances();
      await app.ledgerSync.expectInstanceVisible(cliMemberPubKey);

      // Removing an instance navigates to device selection first, unlike desktop where the row's
      // Remove button goes straight to the device.
      await app.ledgerSync.removeInstance(cliMemberPubKey);
      await app.common.selectKnownDevice();
      await app.ledgerSync.removeMemberFromLedgerSyncOnSpeculos();
      // The app navigates to a success screen after removal, unmounting the instances list.
      // Navigate back so the assertion runs against the live list, not a stale screen.
      await openLedgerSyncSettings();
      await app.ledgerSync.openManageInstances();
      await app.ledgerSync.expectInstanceRemoved(cliMemberPubKey);
    });
  });
}

export function runLedgerSyncDeleteBackupTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.WALLET_XP);
  describeIfNotNanoS("Ledger Sync - delete backup", () => {
    setupSeed();
    cleanupAfterAll();

    beforeAll(async () => {
      await initPreSeeded([app.ledgerSync.pushAccountsToTrustchain([ethAccount])]);
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Deleting the backup destroys the trustchain and unsyncs the instance", async () => {
      await app.trustchain.expectToHoldAccount(ethAccount.id, ethAccount.currencyId);

      await openLedgerSyncSettings();
      await app.ledgerSync.openDeleteSync();
      await app.ledgerSync.confirmDeleteSync();
      await app.ledgerSync.expectBackupDeletion();

      await app.trustchain.expectToBeDestroyed();
    });
  });
}
