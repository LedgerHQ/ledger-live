import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";

describe("Send flow", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "EthAccountXrpAccountReadOnlyFalse",
    });

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-3537");
  it("[Blacklist] Blocking transactions to sanctioned recipient addresses in send flow", async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.send.openViaDeeplink();
    await app.send.selectAccount("Ethereum 1");
    await app.send.setRecipient(Addresses.SANCTIONED_ETHEREUM);
    await app.send.expectSendRecipientTitleError("Keeping you safe");
    await app.send.expectSendRecipientDescriptionError(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM}`,
    );
    await app.send.expectLearnMoreLink();
    await app.send.expectContinueButtonDisabled();
  });

  $TmsLink("B2CQA-3536");
  it("[Blacklist] Blocking transactions from sanctioned user addresses in send flow", async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.send.openViaDeeplink();
    await app.send.selectAccount("Sanctioned Ethereum");
    await app.send.expectSendSenderTitleError("Keeping you safe");
    await app.send.expectSendSenderDescriptionError(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM}`,
    );
    await app.send.expectLearnMoreLink();
    await app.send.expectContinueButtonDisabled();

    await app.send.setRecipient(Addresses.SANCTIONED_ETHEREUM);
    await app.send.expectContinueButtonDisabled();
  });

  $TmsLink("B2CQA-3692");
  it("[Blacklist] Blocking transactions from sanctioned user address to sanctioned user address in send flow", async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.send.openViaDeeplink();
    await app.send.selectAccount("Sanctioned Ethereum");
    await app.send.expectSendSenderTitleError("Keeping you safe");
    await app.send.expectSendSenderDescriptionError(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM}`,
    );
    await app.send.expectLearnMoreLink();
    await app.send.expectContinueButtonDisabled();

    await app.send.setRecipient(Addresses.SANCTIONED_ETHEREUM);
    await app.send.expectSendRecipientTitleError("Keeping you safe");
    await app.send.expectSendRecipientDescriptionError(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM}`,
    );
    await app.send.expectLearnMoreLink();
    await app.send.expectContinueButtonDisabled();
  });
});
