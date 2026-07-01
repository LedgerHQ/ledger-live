describe("SEI EVM Native Staking - Delegate flow", () => {
  const SEI_CURRENCY_ID = "sei_evm";
  const DELEGATION_AMOUNT = "2";
  const EMPTY_ACCOUNT_ID = "mock:2:sei_evm:0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707:";
  const STAKED_ACCOUNT_ID = "mock:2:sei_evm:0x18E9A4F2A5A2B01F35E7D086E75D7D01530A1A9F:";

  async function selectAccount(accountId: string) {
    const accountRowId = `account-row-${accountId}`;
    if (!(await IsIdVisible(accountRowId))) {
      await scrollToId(accountRowId);
    }
    await waitForElementById(accountRowId);
    await tapById(accountRowId);
  }

  beforeAll(async () => {
    await app.init({
      userdata: "seiEvmStaking",
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("Delegate happy path: start delegating, validator list is shown, validator selected", async () => {
    await app.assetAccountsPage.openViaDeeplink(SEI_CURRENCY_ID);
    await selectAccount(EMPTY_ACCOUNT_ID);
    await app.evmDelegate.startDelegate();
    await app.evmDelegate.selectFirstValidator();
    await app.evmDelegate.setAmountAndContinue(DELEGATION_AMOUNT);
  });

  it("Already-delegated validator is reflected on the account page", async () => {
    await app.assetAccountsPage.openViaDeeplink(SEI_CURRENCY_ID);
    await selectAccount(STAKED_ACCOUNT_ID);
    await app.evmDelegate.expectDelegatedAssetsVisible();
    await app.evmDelegate.expectAddDelegationCtaVisible();
  });
});
