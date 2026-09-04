import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { describeIfNotNanoS } from "@e2e/helpers/commonHelpers";
import {
  LEDGER_SYNC_FEATURE_FLAGS,
  cleanupLedgerSyncAfterAll,
  setupLedgerSyncSeed,
} from "@e2e/helpers/ledgerSyncHelpers";
import type { LedgerSyncCliCommand } from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
import { ethAccount, secondEthAccount } from "@ledgerhq/live-e2e-shared/ledgerSync/testData";

const APP_INSTANCE_NAME = "LWM";
const defaultAccountName = `${Currency.ETH.name} 1`;
const secondAccountName = `${Currency.ETH.name} 2`;
const renamedAccountName = `${Currency.ETH.name} LedgerSync 1`;

/** Boots the app already a member of a freshly created trustchain, skipping the activation UI. */
async function initPreSeeded(seedCommands: LedgerSyncCliCommand[] = []) {
  await app.init({
    speculosApp: AppInfos.LS,
    featureFlags: LEDGER_SYNC_FEATURE_FLAGS,
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
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

    beforeAll(async () => {
      // The CLI needs the LedgerSync app to create the trustchain and the phone needs Ethereum to
      // add the account: mobile launches both in parallel rather than relaunching one device.
      await app.init({
        speculosApp: Currency.ETH.speculosApp,
        featureFlags: LEDGER_SYNC_FEATURE_FLAGS,
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
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

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
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

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
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

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
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

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
