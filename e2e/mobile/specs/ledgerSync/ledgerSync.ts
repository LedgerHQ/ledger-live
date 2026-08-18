import { allure } from "jest-allure2-reporter/api";
import { device } from "detox";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { launchApp } from "../../helpers/commonHelpers";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { setAllFeatureFlags } from "../../bridge/server";
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
 * A seed per run, so every suite builds its trustchain from scratch instead of clearing whatever
 * the previous run left on the backend, and so no test ever derives accounts from the shared seed.
 */
function setupSeed() {
  let previousSeed: string | undefined;
  beforeAll(() => {
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

/** DBSave throttles the feature flag write; terminating sooner loses the override. */
const FLAG_PERSIST_DELAY = 1_000;

/**
 * The app builds its trustchain SDK on first render and keeps it in a module singleton, so the
 * environment carried by `llmWalletSync` only takes effect when the flag is already in place at
 * boot. Overrides survive a relaunch, so persisting then relaunching is what makes the app follow
 * `LEDGER_SYNC_ENVIRONMENT`; without it the app stays on the flag default while the CLI does not,
 * and the two talk to different backends.
 *
 * Only this flag is persisted. The rest arrive from `app.init` after boot, which is the order every
 * other suite gets on a fresh CI device — booting with the whole set changes which portfolio
 * variant renders, and with it the add-account entry point.
 */
async function relaunchOnLedgerSyncEnvironment() {
  await setAllFeatureFlags(ledgerSyncFeatureFlags);
  await new Promise(resolve => setTimeout(resolve, FLAG_PERSIST_DELAY));
  await device.terminateApp();
  // Relaunching moves the bridge to a new port, which Android only reaches once reversed.
  const port = await launchApp({ newInstance: true });
  await device.reverseTcpPort(port);
}

/** Boots the app already a member of a freshly created trustchain, skipping the activation UI. */
async function initPreSeeded(seedCommands: LedgerSyncCliCommand[] = []) {
  await relaunchOnLedgerSyncEnvironment();
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

// TODO: Rename every ledgerSync*.skip.spec.ts back to *.spec.ts once LIVE-35808 is fixed —
// staging cloud-sync cannot verify the JWT that staging trustchain issues, so every cloud-sync
// call fails with 400 on the Authorization header.
function linkBlockingBug() {
  allure.issue("LIVE-35808");
}

export function runLedgerSyncAddAccountTest(tmsLinks: string[], tags: string[]) {
  linkBlockingBug();
  setTeamOwner(Team.WALLET_XP);
  describe("Ledger Sync - add account", () => {
    setupSeed();
    cleanupAfterAll();

    beforeAll(async () => {
      await relaunchOnLedgerSyncEnvironment();
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
  linkBlockingBug();
  setTeamOwner(Team.WALLET_XP);
  describe("Ledger Sync - rename account", () => {
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
  linkBlockingBug();
  setTeamOwner(Team.WALLET_XP);
  describe("Ledger Sync - delete account", () => {
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
  linkBlockingBug();
  setTeamOwner(Team.WALLET_XP);
  describe("Ledger Sync - delete instance", () => {
    setupSeed();
    cleanupAfterAll();

    beforeAll(async () => {
      await initPreSeeded([app.ledgerSync.addTrustchainMember(APP_INSTANCE_NAME)]);
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it("Removing an instance drops it from the synchronized list", async () => {
      // The app was seeded with the member added last, so the CLI is the other instance.
      const cliMemberPubKey = app.ledgerSync.ledgerKeyRingProtocolArgs.pubKey;

      await openLedgerSyncSettings();
      await app.ledgerSync.openManageInstances();
      await app.ledgerSync.expectInstanceVisible(cliMemberPubKey);

      await app.ledgerSync.removeInstance(cliMemberPubKey);
      await app.ledgerSync.removeMemberFromLedgerSyncOnSpeculos();
      await app.ledgerSync.expectInstanceRemoved(cliMemberPubKey);
    });
  });
}

export function runLedgerSyncDeleteBackupTest(tmsLinks: string[], tags: string[]) {
  linkBlockingBug();
  setTeamOwner(Team.WALLET_XP);
  describe("Ledger Sync - delete backup", () => {
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
