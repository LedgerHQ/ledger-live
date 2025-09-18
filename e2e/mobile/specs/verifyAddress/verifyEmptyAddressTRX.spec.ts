describe("Verify Address warnings", () => {
  const account = Account.TRX_3;

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      cliCommands: [
        (userdataPath?: string) => {
          return CLI.liveData({
            currency: account.currency.id,
            index: account.index,
            appjson: userdataPath,
            add: true,
          });
        },
      ],
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-1551");
  it(`Verify address warning for ${account.currency.name}`, async () => {
    await app.account.openViaDeeplink();
    await app.account.goToAccountByName(account.accountName);
    await app.account.tapReceive();
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(account.currency.ticker, account.accountName);
    await app.receive.expectTronNewAddressWarning();
  });
});
