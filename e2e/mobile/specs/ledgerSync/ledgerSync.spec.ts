import { describeIfNotNanoS } from "../../helpers/commonHelpers";

const tmsLinks = ["B2CQA-2292", "B2CQA-2293", "B2CQA-2296"];
const tags = ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

describeIfNotNanoS(`Ledger Sync Accounts`, () => {
  beforeAll(async () => {
    await app.init({
      speculosApp: AppInfos.LS,
      cliCommands: [
        ...app.ledgerSync.initializeThenDeleteTrustChain(),
        async () => app.ledgerSync.initializeLedgerKeyRingProtocol(),
        async () => app.ledgerSync.initializeLedgerSync(),
        async () =>
          CLI.ledgerSync({
            ...app.ledgerSync.ledgerKeyRingProtocolArgs,
            ...app.ledgerSync.ledgerSyncPushDataArgs,
          }),
      ],
      //TODO: Remove line when LIVE-24337 is fixed
      featureFlags: {
        llmAccountListUI: { enabled: true },
      },
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  it(`Synchronize one instance then delete the backup`, async () => {
    await app.accounts.openViaDeeplink();
    await app.accounts.expectNoAccount();
    await app.ledgerSync.goToLedgerSync();
    await app.ledgerSync.expectLedgerSyncPageIsDisplayed();
    await app.ledgerSync.tapTurnOnSync();
    await app.ledgerSync.tapUseMyLedgerDevice();
    await app.common.selectKnownDevice();
    await app.ledgerSync.activateLedgerSyncOnSpeculos();
    await app.ledgerSync.expectLedgerSyncSuccessPage();
    await app.ledgerSync.closeActivationSuccessPage();
    await app.portfolio.waitForPortfolioWithAccounts();
    await app.accounts.openViaDeeplink();
    await app.accounts.expectAccountsNumber(2, app.ledgerSync.ledgerSyncPushDataArgs.data);
    await app.ledgerSync.goToLedgerSync(true);
    await app.ledgerSync.openDeleteSync();
    await app.ledgerSync.confirmDeleteSync();
    await app.ledgerSync.expectBackupDeletion();
  });
});
