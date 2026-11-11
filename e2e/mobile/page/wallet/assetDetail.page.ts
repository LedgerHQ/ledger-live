import { Step } from "jest-allure2-reporter/api";
import { parseTickerAmount } from "@e2e/helpers/commonHelpers";
import { byId, byIdWithDescendantText, type NativeHandle } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";
import { expectWithinTolerance } from "@e2e/utils/amountUtils";

type HoldingAddressExpectation = {
  accountId: string;
  name: string;
  addressFragment?: string;
};

// Allows half a unit of the last decimal each displayed value.
const displayRoundingTolerance = (text: string) => {
  const decimals = /\.(\d+)/.exec(text)?.[1].length ?? 0;
  return 0.5 * 10 ** -decimals;
};

const OPERATIONS_LIST_ITEM_ID = "operations-list-item";

export default class AssetDetailPage {
  // The testID ends with the currency id (`asset-detail-scroll-view-<currencyId>`).
  private readonly anyScrollView = byId(/^asset-detail-scroll-view-.*/);
  private readonly coinCapsuleIcon = (ticker: string) =>
    byId(`asset-detail-coin-capsule-icon-${ticker}`);
  private readonly marketPrice = byId("asset-detail-market-price");
  private readonly marketVariation = byId("asset-detail-market-variation");
  private readonly totalBalance = byId("asset-detail-total-balance");
  private readonly totalBalanceCrypto = byId("asset-detail-total-balance-crypto");
  private readonly addAccount = byId("asset-detail-add-account");
  private readonly coinOptionsTrailing = byId("asset-detail-coin-options-trailing");
  private readonly coinOptionsFavouriteRow = byId("asset-detail-coin-options-favourite-row");
  private readonly coinOptionsAddFavouriteRow = byId("asset-detail-coin-options-favourite-row-add");
  private readonly addressesHeader = byId("asset-detail-addresses-header");
  private readonly transactionsHeader = byId("asset-detail-transactions-header");
  private readonly operationDetailsTitle = byId("operationDetails-title");
  private readonly operationsListItem = (index = 0) => byId(OPERATIONS_LIST_ITEM_ID, index);
  private readonly operationByTicker = (ticker: string) =>
    byIdWithDescendantText({ id: OPERATIONS_LIST_ITEM_ID, text: ticker });
  private readonly addressItemNameAt = (index: number) =>
    byId(/asset-detail-address-item-name-.*/, index);
  private readonly addressItemName = (accountId: string) =>
    byId(`asset-detail-address-item-name-${accountId}`);
  private readonly addressItemAddress = (accountId: string) =>
    byId(`asset-detail-address-item-address-${accountId}`);
  private readonly addressItemCounterValue = (accountId: string) =>
    byId(`asset-detail-address-item-countervalue-${accountId}`);
  private readonly addressItemBalance = (accountId: string) =>
    byId(`asset-detail-address-item-balance-${accountId}`);

  /** Detox cannot scroll a container matched by a regex, so resolve its full testID first. */
  private async scrollView(): Promise<NativeHandle> {
    return byId(await this.anyScrollView.getIdentifier());
  }

  private async scrollToTransactions() {
    await this.transactionsHeader.scrollTo(await this.scrollView(), { pixels: 500 });
  }

  /**
   * Scrolls until the header is 75% visible, the same threshold as the assertion, so it settles
   * clear of the sticky Buy/Swap footer without overshooting into the top nav.
   */
  private async scrollToAddressesSection() {
    await this.addressesHeader.scrollTo(await this.scrollView());
    await this.addressesHeader.expectVisible();
  }

  private async scrollToAddressItem(accountId: string) {
    await this.scrollToAddressesSection();
    await this.addressItemName(accountId).scrollTo(await this.scrollView());
    await this.addressItemName(accountId).expectVisible();
  }

  private async openCoinOptions() {
    if (await this.coinOptionsFavouriteRow.isVisible(TIMEOUT.xxxsmall)) {
      return;
    }
    await this.coinOptionsTrailing.tap();
    await this.coinOptionsFavouriteRow.expectVisible();
  }

  private async tapFavouriteRow(expectedState: NativeHandle) {
    await expectedState.expectVisible();
    await this.coinOptionsFavouriteRow.tap();
    await this.coinOptionsFavouriteRow.waitNotVisible();
  }

  @Step("Expect Asset Detail page for ticker {{{0}}}")
  async expectAssetDetailPageForTicker(ticker: string) {
    await this.marketPrice.scrollTo(await this.scrollView(), { direction: "up" });
    await this.coinOptionsTrailing.waitVisible();
    await this.coinCapsuleIcon(ticker).expectVisible();
  }

  @Step("Expect Asset Detail page")
  async expectAssetDetailPageVisible() {
    await this.anyScrollView.waitVisible();
    await this.marketPrice.waitVisible();
    await this.coinOptionsTrailing.waitVisible();
    await this.anyScrollView.expectVisible();
  }

  @Step("Check if Asset Detail page is visible")
  async isAssetDetailPageVisible(timeout = TIMEOUT.xxsmall) {
    return await this.anyScrollView.isVisible(timeout);
  }

  @Step("Check if Asset Detail page for ticker is visible {{{0}}}")
  async isAssetDetailPageForTickerVisible(ticker: string, timeout = TIMEOUT.xxsmall) {
    return (
      (await this.anyScrollView.isVisible(timeout)) &&
      (await this.coinCapsuleIcon(ticker).isVisible(timeout))
    );
  }

  @Step("Expect Asset Detail market data")
  async expectMarketDataVisible() {
    await this.marketPrice.scrollTo(await this.scrollView(), { direction: "up" });
    await this.marketPrice.expectVisible();
    await this.marketVariation.expectVisible();
  }

  @Step("Expect Asset Detail total crypto balance for ticker {{{0}}}")
  async expectTotalBalanceCryptoForTicker(ticker: string) {
    await this.totalBalance.scrollTo(await this.scrollView());
    await this.totalBalanceCrypto.expectVisible();
    jestExpect(parseTickerAmount(await this.totalBalanceCrypto.getText(), ticker)).toBeGreaterThan(
      0,
    );
  }

  @Step("Expect Asset Detail balance, addresses and transaction sections")
  async expectPortfolioSectionsVisible() {
    await this.totalBalance.scrollTo(await this.scrollView());
    await this.totalBalance.expectVisible();
    await this.scrollToAddressesSection();
    await this.addAccount.expectVisible();
    await this.scrollToTransactions();
    await this.transactionsHeader.expectVisible();
  }

  @Step("Expect holding address details for {{{0.length}}} addresses")
  async expectHoldingAddressDetails(expectedAddresses: HoldingAddressExpectation[]) {
    for (const { accountId, name, addressFragment } of expectedAddresses) {
      await this.scrollToAddressItem(accountId);
      await this.addressItemName(accountId).expectText(name);
      if (addressFragment) {
        await this.addressItemAddress(accountId).expectText(addressFragment, {
          containing: true,
          ignoreCase: true,
        });
      }
      await this.addressItemCounterValue(accountId).expectTextMatching(/\d/);
      await this.addressItemBalance(accountId).expectVisible();
    }
  }

  @Step("Expect holding address balances to add up to total {{{1}}}")
  async expectHoldingAddressBalancesSumToTotal(accountIds: string[], ticker: string) {
    await this.totalBalance.scrollTo(await this.scrollView());
    const totalText = await this.totalBalanceCrypto.getText();
    const totalBalance = parseTickerAmount(totalText, ticker);

    let holdingBalance = 0;
    let tolerance = displayRoundingTolerance(totalText);
    for (const accountId of accountIds) {
      await this.scrollToAddressItem(accountId);
      const balanceText = await this.addressItemBalance(accountId).getText();
      const accountBalance = parseTickerAmount(balanceText, ticker);
      jestExpect(accountBalance).toBeGreaterThan(0);
      holdingBalance += accountBalance;
      tolerance += displayRoundingTolerance(balanceText);
    }

    expectWithinTolerance(holdingBalance, { expected: totalBalance, tolerance });
    return { holdingBalance, totalBalance };
  }

  @Step("Open holding address {{{0}}}")
  async openHoldingAddress(accountId: string) {
    await this.addressItemName(accountId).revealForTap(await this.scrollView());
    await this.addressItemName(accountId).tap();
  }

  @Step("Get visible Asset Detail transaction count for ticker {{{0}}}")
  async getVisibleTransactionCountForTicker(ticker: string) {
    await this.scrollToTransactions();
    await this.operationsListItem().scrollTo(await this.scrollView());
    const visibleOperationsCount = await this.operationsListItem().count();
    jestExpect(visibleOperationsCount).toBeGreaterThan(0);

    for (let index = 0; index < visibleOperationsCount; index++) {
      await this.operationsListItem(index).expectLabel(ticker, { containing: true });
    }

    return visibleOperationsCount;
  }

  @Step("Open first Asset Detail transaction {{{0}}}")
  async openFirstTransaction(ticker: string) {
    await this.scrollToTransactions();
    await this.operationsListItem().revealForTap(await this.scrollView());
    await this.operationByTicker(ticker).expectVisible();
    await this.operationsListItem().tap();
    await this.operationDetailsTitle.waitVisible();
  }

  @Step("Open Asset Detail transactions history")
  async openTransactionsHistory() {
    await this.transactionsHeader.revealForTap(await this.scrollView());
    await this.transactionsHeader.tap();
  }

  @Step("Scroll to addresses section header")
  async scrollToAddressesHeader() {
    await this.scrollToAddressesSection();
  }

  @Step("Get address item name at index {{{0}}}")
  async getAddressItemName(index = 0) {
    return await this.addressItemNameAt(index).getText();
  }

  @Step("Add asset to favorites from Asset Detail")
  async addToFavorites() {
    await this.openCoinOptions();
    await this.tapFavouriteRow(this.coinOptionsAddFavouriteRow);
  }
}
