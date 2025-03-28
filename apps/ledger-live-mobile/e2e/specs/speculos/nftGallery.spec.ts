describe("NFT Gallery screen", () => {
  const nanoApp = AppInfos.ETHEREUM;
  const accountCurrency = Currency.ETH.id;

  beforeAll(async () => {
    await app.init({
      speculosApp: nanoApp,
      cliCommands: [
        async (userdataPath?: string) => {
          return CLI.liveData({
            currency: nanoApp.name,
            index: 0,
            appjson: userdataPath,
            add: true,
          });
        },
      ],
    });
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.nftGallery.openViaDeeplink();
  });

  $TmsLink("B2CQA-132");
  it("should navigate to/from portfolio on tab press", async () => {
    await app.walletTabNavigator.navigateToPortfolio();
    await app.nftGallery.expectGalleryNotVisible();
    await app.portfolio.expectPortfolioWithAccounts();

    await app.walletTabNavigator.navigateToNftGallery();
    await app.nftGallery.expectGalleryVisible();

    await app.nftGallery.waitForList();
    await app.nftGallery.expectNftVisible();
  });

  it("should navigate to NFT viewer page on NFT gallery item press", async () => {
    await app.nftGallery.clickOnNft();
    await app.nftViewer.expectVisible();
    await app.nftGallery.expectGalleryNotVisible();

    await app.nftViewer.navigateToNftGallery();
    await app.nftGallery.expectGalleryVisible();
  });

  it('should show receive NFT\'s modal when "Adding new item" from list', async () => {
    await app.nftGallery.tapAddNew();
    await app.nftGallery.expectNftReceiveModalVisible();

    await app.nftGallery.continueFromReceiveNFTsModal();
    await app.receive.expectFirstStep();
    await app.receive.selectCurrency(accountCurrency);
    await app.receive.expectSecondStepNetworks([accountCurrency]);
    await app.receive.selectNetwork(accountCurrency);
    await app.receive.expectSecoundStepAccounts();
    await app.common.closePage();
  });

  it("should let users hide NFT's", async () => {
    await app.nftGallery.openViaDeeplink();
    await app.nftGallery.hideAllNft();
    await app.nftGallery.expectGalleryEmptyState();

    // show filters on "reset" button tap
    await app.nftGallery.expectFilterDrawerNotVisible();
    await app.nftGallery.tapResetFilters();
    await app.nftGallery.expectFilterDrawerVisible();
  });
});
