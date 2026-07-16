import { Step } from "jest-allure2-reporter/api";
import { delay, normalizeText, parseTickerAmount } from "../../helpers/commonHelpers";
import {
  DEFAULT_TIMEOUT,
  QUICK_VISIBILITY_PROBE_TIMEOUT,
  VISIBILITY_PROBE_TIMEOUT,
} from "../../helpers/elementHelpers";

type HoldingAddressExpectation = {
  accountId: string;
  name: string;
  addressFragment?: string;
};

const TOKEN_BALANCE_DECIMAL_PRECISION = 5;
const OPERATION_DETAILS_OPEN_TIMEOUT = 5000;

export default class AssetDetailPage {
  screenId = "asset-detail-screen";
  coinCapsuleId = "asset-detail-coin-capsule";
  coinCapsuleIconId = (ticker: string) => `asset-detail-coin-capsule-icon-${ticker}`;
  scrollViewId = /^asset-detail-scroll-view-.*/;
  marketPriceId = "asset-detail-market-price";
  marketVariationId = "asset-detail-market-variation";
  totalBalanceId = "asset-detail-total-balance";
  totalBalanceCryptoId = "asset-detail-total-balance-crypto";
  addAccountId = "asset-detail-add-account";
  coinOptionsTrailingId = "asset-detail-coin-options-trailing";
  coinOptionsFavouriteRowId = "asset-detail-coin-options-favourite-row";
  coinOptionsAddFavouriteRowId = "asset-detail-coin-options-favourite-row-add";
  addressesId = "asset-detail-addresses";
  addressesHeaderId = "asset-detail-addresses-header";
  transactionsId = "asset-detail-transactions";
  operationsListItemId = "operations-list-item";
  transactionsHeaderId = "asset-detail-transactions-header";
  operationDetailsTitleId = "operationDetails-title";

  addressItemNameId = (accountId: string) => `asset-detail-address-item-name-${accountId}`;
  addressItemAddressId = (accountId: string) => `asset-detail-address-item-address-${accountId}`;
  addressItemCounterValueId = (accountId: string) =>
    `asset-detail-address-item-countervalue-${accountId}`;
  addressItemBalanceId = (accountId: string) => `asset-detail-address-item-balance-${accountId}`;
  operationByTicker = (ticker: string) =>
    getElementByIdWithDescendantTexts(this.operationsListItemId, ticker);

  // The Asset Detail ScrollView testID is dynamic (`asset-detail-scroll-view-<currencyId>`).
  // A regex matcher works for visibility waits but not as a scroll container for Detox
  // scroll actions, so resolve the concrete id before every scroll.
  private async getScrollViewId(): Promise<string> {
    await waitForElementById(this.scrollViewId);
    return getIdByRegexp(this.scrollViewId);
  }

  private async scrollToTransactions() {
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.transactionsHeaderId, scrollViewId, 500, "down");
  }

  private async scrollToAddressesSection() {
    const scrollViewId = await this.getScrollViewId();
    // Scroll until the header is at least 75% visible, matching the assertion below.
    // Using the default visibility threshold (instead of a lenient locate + fixed slack)
    // lets performScroll settle the header clear of the sticky Buy/Swap footer
    // (absolutely positioned, ~CTAS_HEIGHT tall) without overshooting into the top nav.
    await scrollToId(this.addressesHeaderId, scrollViewId, 300, "down");
    await detoxExpect(getElementById(this.addressesHeaderId)).toBeVisible();
  }

  private async tapTransactionUntilOperationDetailsOpen() {
    for (let attempt = 0; attempt < 3; attempt++) {
      await tapById(this.operationsListItemId, 0);
      if (await IsIdVisible(this.operationDetailsTitleId, OPERATION_DETAILS_OPEN_TIMEOUT)) return;
      await delay(500);
    }
    throw new Error("Operation details did not open after tapping the transaction");
  }

  private async scrollToAddressItem(accountId: string) {
    await this.scrollToAddressesSection();
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.addressItemNameId(accountId), scrollViewId, 700, "down");
    await waitForElementById(this.addressItemNameId(accountId), DEFAULT_TIMEOUT, {
      checkVisibility: false,
    });
  }

  private async openCoinOptions() {
    if (await IsIdVisible(this.coinOptionsFavouriteRowId, QUICK_VISIBILITY_PROBE_TIMEOUT)) {
      return;
    }

    await waitForElementById(this.coinOptionsTrailingId);
    await tapById(this.coinOptionsTrailingId);
    await detoxExpect(getElementById(this.coinOptionsFavouriteRowId)).toBeVisible();
  }

  private async tapFavouriteRow(expectedStateId: string) {
    await detoxExpect(getElementById(expectedStateId)).toBeVisible();
    await tapByIdAndExpectToDisappear(this.coinOptionsFavouriteRowId);
  }

  @Step("Expect Asset Detail page for ticker")
  async expectAssetDetailPageForTicker(ticker: string) {
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.marketPriceId, scrollViewId, 1200, "up");
    await waitForElementById(this.marketPriceId);
    await waitForElementById(this.coinOptionsTrailingId);
    await detoxExpect(getElementById(this.coinCapsuleIconId(ticker))).toBeVisible();
  }

  @Step("Expect Asset Detail page")
  async expectAssetDetailPageVisible() {
    await waitForElementById(this.scrollViewId);
    await waitForElementById(this.marketPriceId);
    await waitForElementById(this.coinOptionsTrailingId);
    await detoxExpect(getElementById(this.scrollViewId)).toBeVisible();
  }

  @Step("Check if Asset Detail page is visible")
  async isAssetDetailPageVisible(timeout = VISIBILITY_PROBE_TIMEOUT) {
    return await IsIdVisible(this.scrollViewId, timeout);
  }

  @Step("Check if Asset Detail page for ticker is visible")
  async isAssetDetailPageForTickerVisible(ticker: string, timeout = VISIBILITY_PROBE_TIMEOUT) {
    return (
      (await IsIdVisible(this.scrollViewId, timeout)) &&
      (await IsIdVisible(this.coinCapsuleIconId(ticker), timeout))
    );
  }

  @Step("Expect Asset Detail market data")
  async expectMarketDataVisible() {
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.marketPriceId, scrollViewId, 1200, "up");
    await waitForElementById(this.marketPriceId);
    await detoxExpect(getElementById(this.marketPriceId)).toBeVisible();
    await detoxExpect(getElementById(this.marketVariationId)).toBeVisible();
  }

  @Step("Expect Asset Detail total crypto balance for ticker")
  async expectTotalBalanceCryptoForTicker(ticker: string) {
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.totalBalanceId, scrollViewId);
    await detoxExpect(getElementById(this.totalBalanceCryptoId)).toBeVisible();
    jestExpect(
      parseTickerAmount(await getTextOfElement(this.totalBalanceCryptoId), ticker),
    ).toBeGreaterThan(0);
  }

  @Step("Expect Asset Detail balance, addresses and transaction sections")
  async expectPortfolioSectionsVisible() {
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.totalBalanceId, scrollViewId);
    await detoxExpect(getElementById(this.totalBalanceId)).toBeVisible();
    await this.scrollToAddressesSection();
    await detoxExpect(getElementById(this.addAccountId)).toBeVisible();
    await this.scrollToTransactions();
    await detoxExpect(getElementById(this.transactionsHeaderId)).toBeVisible();
  }

  @Step("Expect holding address details")
  async expectHoldingAddressDetails(expectedAddresses: HoldingAddressExpectation[]) {
    for (const expectedAddress of expectedAddresses) {
      await this.scrollToAddressItem(expectedAddress.accountId);
      jestExpect(await getTextOfElement(this.addressItemNameId(expectedAddress.accountId))).toBe(
        expectedAddress.name,
      );
      if (expectedAddress.addressFragment) {
        const addressLabel = await getTextOfElement(
          this.addressItemAddressId(expectedAddress.accountId),
        );
        jestExpect(addressLabel.toLowerCase()).toContain(
          expectedAddress.addressFragment.toLowerCase(),
        );
      }
      const counterValue = normalizeText(
        await getTextOfElement(this.addressItemCounterValueId(expectedAddress.accountId)),
      );
      jestExpect(counterValue).toMatch(/\d/);
      await detoxExpect(
        getElementById(this.addressItemBalanceId(expectedAddress.accountId)),
      ).toBeVisible();
    }
  }

  @Step("Expect holding address balances to add up to total")
  async expectHoldingAddressBalancesSumToTotal(accountIds: string[], ticker: string) {
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.totalBalanceId, scrollViewId);
    const totalBalance = parseTickerAmount(
      await getTextOfElement(this.totalBalanceCryptoId),
      ticker,
    );

    let holdingBalance = 0;
    for (const accountId of accountIds) {
      await this.scrollToAddressItem(accountId);
      const accountBalance = parseTickerAmount(
        await getTextOfElement(this.addressItemBalanceId(accountId)),
        ticker,
      );
      jestExpect(accountBalance).toBeGreaterThan(0);
      holdingBalance += accountBalance;
    }

    jestExpect(holdingBalance).toBeCloseTo(totalBalance, TOKEN_BALANCE_DECIMAL_PRECISION);
    return { holdingBalance, totalBalance };
  }

  @Step("Open holding address")
  async openHoldingAddress(accountId: string) {
    await this.scrollToAddressItem(accountId);
    await tapById(this.addressItemNameId(accountId));
  }

  @Step("Get visible Asset Detail transaction count for ticker")
  async getVisibleTransactionCountForTicker(ticker: string) {
    await this.scrollToTransactions();
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.operationsListItemId, scrollViewId, 300, "down");
    const visibleOperationsCount = await countElementsById(this.operationsListItemId);
    jestExpect(visibleOperationsCount).toBeGreaterThan(0);

    for (let index = 0; index < visibleOperationsCount; index++) {
      const operationLabel = await getLabelOfElement(this.operationsListItemId, index);
      jestExpect(operationLabel).toContain(ticker);
    }

    return visibleOperationsCount;
  }

  @Step("Open first Asset Detail transaction")
  async openFirstTransaction(ticker: string) {
    await this.scrollToTransactions();
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.operationsListItemId, scrollViewId, 300, "down");
    // Extra "slack" scroll so the first operation is centered and not stuck behind the
    // sticky Buy/Swap footer, which would otherwise intercept the tap on Android.
    await scrollByPixels(scrollViewId, 200, "down");
    await detoxExpect(this.operationByTicker(ticker).atIndex(0)).toBeVisible();
    await this.tapTransactionUntilOperationDetailsOpen();
  }

  @Step("Open Asset Detail transactions history")
  async openTransactionsHistory() {
    const scrollViewId = await this.getScrollViewId();
    await scrollToId(this.transactionsHeaderId, scrollViewId, 500, "down");
    await detoxExpect(getElementById(this.transactionsHeaderId)).toBeVisible();
    await tapById(this.transactionsHeaderId);
  }

  @Step("Scroll to addresses section header")
  async scrollToAddressesHeader() {
    await this.scrollToAddressesSection();
  }

  @Step("Get address item name at index")
  async getAddressItemName(index = 0) {
    return await getTextOfElement(/asset-detail-address-item-name-.*/, index);
  }

  @Step("Add asset to favorites from Asset Detail")
  async addToFavorites() {
    await this.openCoinOptions();
    await this.tapFavouriteRow(this.coinOptionsAddFavouriteRowId);
  }
}
