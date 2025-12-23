import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";

describe("Delegate flow", () => {
  beforeAll(async () => {
    await app.init({ userdata: "EthAccountXrpAccountReadOnlyFalse" });
    await app.dummyWalletApp.startApp();

    await app.portfolio.waitForPortfolioPageToLoad();
    await app.dummyWalletApp.openApp();
    await app.dummyWalletApp.expectApp("dark");
  });

  afterAll(async () => {
    await app.dummyWalletApp.stopApp();
  });

  /**
   * This test use the dummy wallet app to send a transaction to a sanctioned address.
   * We can not rely on third party provider for our test, any change from them will break the test and make it flaky
   * Since the staking flow ends on the Sign Transaction modal, it is equivalent to use the Wallet API to open the modal
   */
  $TmsLink("B2CQA-3654");
  it("[Blacklist] Blocking staking transactions for sanctioned addresses", async () => {
    await app.dummyWalletApp.sendRequest();
    await app.cryptoDrawer.selectCurrencyFromDrawer("Ethereum");
    await app.cryptoDrawer.selectAccountFromDrawer(Account.SANCTIONED_ETH.accountName);
    const selectedAccount: { id: string } = await app.dummyWalletApp.getResOutput();

    await app.dummyWalletApp.signTransaction(
      selectedAccount.id,
      ["ethereum"],
      "100000000",
      Addresses.ETH_2,
    );

    await app.send.expectSendSummaryTitleError("Keeping you safe");
    await app.send.expectSendSummaryDescriptionError(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM}`,
    );
    await app.send.expectLearnMoreLink();
    await app.send.expectContinueButtonDisabled();
  });
});
