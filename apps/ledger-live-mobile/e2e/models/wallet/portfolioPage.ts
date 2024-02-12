import {
  getElementById,
  getTextOfElement,
  openDeeplink,
  scrollToId,
  tapByElement,
  tapById,
  waitForElementById,
} from "../../helpers";

const baseLink = "portfolio";
export default class PortfolioPage {
  zeroBalance = "$0.00";
  graphCardBalanceId = "graphCard-balance";
  assetBalanceId = "asset-balance";
  readOnlyItemsId = "PortfolioReadOnlyItems";
  transferScrollListId = "transfer-scroll-list";
  stakeMenuButtonId = "transfer-stake-button";
  accountsListView = "PortfolioAccountsList";
  seeAllTransactionButton = "portfolio-seeAll-transaction";
  transactionAmountId = "portfolio-operation-amount";
  emptyPortfolioListId = "PortfolioEmptyList";
  emptyPortfolioList = () => getElementById(this.emptyPortfolioListId);
  portfolioSettingsButton = () => getElementById("settings-icon");
  transferButton = () => getElementById("transfer-button");
  swapTransferMenuButton = () => getElementById("swap-transfer-button");
  stakeTransferMenuButton = () => getElementById(this.stakeMenuButtonId);
  sendTransferMenuButton = () => getElementById("transfer-send-button");
  receiveTransfertMenuButton = () => getElementById("transfer-receive-button");
  sendMenuButton = () => getElementById("send-button");
  marketTabButton = () => getElementById("tab-bar-market");
  walletTabMarket = () => getElementById("wallet-tab-Market");
  earnButton = () => getElementById("tab-bar-earn");
  addAccountCta = "add-account-cta";
  lastTransactionAmount = () => getElementById(this.transactionAmountId, 0);

  navigateToSettings() {
    return tapByElement(this.portfolioSettingsButton());
  }

  openTransferMenu() {
    return tapByElement(this.transferButton());
  }

  navigateToSwapFromTransferMenu() {
    // await scrollToText("Exchange crypto to crypto.", "transfer-scroll-list"); // FIXME: scroll not working
    return tapByElement(this.swapTransferMenuButton());
  }

  waitForPortfolioPageToLoad() {
    return waitForElementById("settings-icon", 120000);
  }

  async navigateToSendFromTransferMenu() {
    await tapByElement(this.sendTransferMenuButton());
  }

  async navigateToStakeFromTransferMenu() {
    await scrollToId(this.stakeMenuButtonId, this.transferScrollListId);
    return tapByElement(this.stakeTransferMenuButton());
  }

  navigateToReceiveFromTransferMenu() {
    return tapByElement(this.receiveTransfertMenuButton());
  }

  async receive() {
    const element = getElementById("receive-button");
    await element.tap();
  }

  async waitForPortfolioReadOnly() {
    await waitForElementById(this.readOnlyItemsId);
    expect(await getTextOfElement(this.graphCardBalanceId)).toBe(this.zeroBalance);
    for (let index = 0; index < 4; index++)
      expect(await getTextOfElement(this.assetBalanceId, index)).toBe(this.zeroBalance);
  }

  openViaDeeplink() {
    return openDeeplink(baseLink);
  }

  openMarketPage() {
    return tapByElement(this.marketTabButton());
  }

  openWalletTabMarket() {
    return tapByElement(this.walletTabMarket());
  }

  openMyLedger() {
    return tapByElement(getElementById("TabBarManager"));
  }

  openEarnApp() {
    return tapByElement(this.earnButton());
  }

  async addAccount() {
    await scrollToId(this.addAccountCta, this.emptyPortfolioListId);
    await tapById(this.addAccountCta);
  }

  async scrollToTransactions() {
    await scrollToId(this.seeAllTransactionButton, this.accountsListView);
  }
}
