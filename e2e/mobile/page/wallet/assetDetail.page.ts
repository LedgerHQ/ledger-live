import { Step } from "jest-allure2-reporter/api";
import { delay, isAndroid, normalizeText } from "../../helpers/commonHelpers";

type HoldingAddressExpectation = {
  accountId: string;
  name: string;
  addressFragment?: string;
};

const TOKEN_BALANCE_DECIMAL_PRECISION = 5;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const parseTickerAmount = (text: string, ticker: string) => {
  const normalized = normalizeText(text).replace(/,/g, "");
  const tickerAmountRegex = new RegExp(String.raw`(-?\d+(?:\.\d+)?)\s*${escapeRegExp(ticker)}`);
  const match = tickerAmountRegex.exec(normalized);
  if (!match) throw new Error(`Unable to parse ${ticker} amount from "${text}"`);
  return Number(match[1]);
};

export default class AssetDetailPage {
  screenId = "asset-detail-screen";
  coinCapsuleId = "asset-detail-coin-capsule";
  coinCapsuleIconId = (ticker: string) => `asset-detail-coin-capsule-icon-${ticker}`;
  scrollViewId = "asset-detail-scroll-view";
  marketPriceId = "asset-detail-market-price";
  marketVariationId = "asset-detail-market-variation";
  totalBalanceId = "asset-detail-total-balance";
  totalBalanceCryptoId = "asset-detail-total-balance-crypto";
  addAccountId = "asset-detail-add-account";
  coinOptionsTrailingId = "asset-detail-coin-options-trailing";
  coinOptionsFavouriteRowId = "asset-detail-coin-options-favourite-row";
  bottomSheetCloseButtonId = "bottom-sheet-header-close-button";
  operationsListItemId = "operations-list-item";
  transactionsHeaderId = "asset-detail-transactions-header";

  addressItemNameId = (accountId: string) => `asset-detail-address-item-name-${accountId}`;
  addressItemAddressId = (accountId: string) => `asset-detail-address-item-address-${accountId}`;
  addressItemCounterValueId = (accountId: string) =>
    `asset-detail-address-item-countervalue-${accountId}`;
  addressItemBalanceId = (accountId: string) => `asset-detail-address-item-balance-${accountId}`;
  favouriteRowWithText = (text: string) =>
    getElementByIdWithDescendantTexts(this.coinOptionsFavouriteRowId, text);
  operationByTicker = (ticker: string) =>
    getElementByIdWithDescendantTexts(this.operationsListItemId, ticker);

  private async scrollToTransactions() {
    await scrollToText("Transactions", this.scrollViewId, 350, "down");
  }

  private async positionTransactionForAndroidTap(ticker: string) {
    if (!isAndroid()) return;

    await scrollToId(this.operationsListItemId, this.scrollViewId, 700, "down");
    await getElementById(this.scrollViewId).swipe("up", "slow", 0.8);
    await detoxExpect(this.operationByTicker(ticker).atIndex(0)).toBeVisible();
    await delay(500);
  }

  private async positionTransactionForNonAndroidTap(ticker: string) {
    if (isAndroid()) return;

    await scrollToId(this.operationsListItemId, this.scrollViewId, 500, "down");
    await getElementById(this.scrollViewId).swipe("up", "slow", 0.6);
    await detoxExpect(this.operationByTicker(ticker).atIndex(0)).toBeVisible();
    // Let the scroll settle so CI does not interpret the next tap as a continued scroll.
    await delay(500);
  }

  private async scrollToAddressItem(accountId: string) {
    await scrollToId(this.addressItemNameId(accountId), this.scrollViewId, 450, "down");
    await waitForElementById(this.addressItemNameId(accountId), 10_000, {
      checkVisibility: false,
    });
  }

  private async openCoinOptions(expectedFavouriteText: string) {
    if (await IsIdVisible(this.coinOptionsFavouriteRowId, 500)) {
      const favouriteRowLabel = await getLabelOfElement(this.coinOptionsFavouriteRowId);
      jestExpect(favouriteRowLabel).toContain(expectedFavouriteText);
      return;
    }

    await waitForElementById(this.coinOptionsTrailingId);
    await tapById(this.coinOptionsTrailingId);
    await detoxExpect(this.favouriteRowWithText(expectedFavouriteText)).toBeVisible();
  }

  private async tapFavouriteRowWithText(text: string) {
    await detoxExpect(this.favouriteRowWithText(text)).toBeVisible();
    await tapById(this.coinOptionsFavouriteRowId);
    await waitForElementNotVisible(this.coinOptionsFavouriteRowId);
  }

  @Step("Expect Asset Detail page for ticker")
  async expectAssetDetailPageForTicker(ticker: string) {
    await waitForElementById(this.scrollViewId);
    await scrollToId(this.marketPriceId, this.scrollViewId, 1200, "up");
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
  async isAssetDetailPageVisible(timeout = 1000) {
    return await IsIdVisible(this.scrollViewId, timeout);
  }

  @Step("Expect Asset Detail market data")
  async expectMarketDataVisible() {
    await waitForElementById(this.marketPriceId);
    await detoxExpect(getElementById(this.marketPriceId)).toBeVisible();
    await detoxExpect(getElementById(this.marketVariationId)).toBeVisible();
  }

  @Step("Expect Asset Detail total crypto balance for ticker")
  async expectTotalBalanceCryptoForTicker(ticker: string) {
    await scrollToId(this.totalBalanceId, this.scrollViewId);
    await detoxExpect(getElementById(this.totalBalanceCryptoId)).toBeVisible();
    jestExpect(
      parseTickerAmount(await getTextOfElement(this.totalBalanceCryptoId), ticker),
    ).toBeGreaterThan(0);
  }

  @Step("Expect Asset Detail balance, addresses and transaction sections")
  async expectPortfolioSectionsVisible() {
    await scrollToId(this.totalBalanceId, this.scrollViewId);
    await detoxExpect(getElementById(this.totalBalanceId)).toBeVisible();
    await scrollToText("Accounts", this.scrollViewId, 350, "down");
    await detoxExpect(getElementByText("Accounts")).toBeVisible();
    await detoxExpect(getElementById(this.addAccountId)).toBeVisible();
    await this.scrollToTransactions();
    await detoxExpect(getElementByText("Transactions")).toBeVisible();
  }

  @Step("Open Add account network drawer from Asset Detail")
  async openAddAccountNetworkDrawer() {
    await scrollToText("Accounts", this.scrollViewId, 350, "down");
    await tapById(this.addAccountId);
    await waitForElementByText("Select network");
  }

  @Step("Expect Add account network drawer")
  async expectAddAccountNetworkDrawer() {
    await detoxExpect(getElementByText("Select network")).toBeVisible();
    await detoxExpect(getElementByText("Polygon")).toBeVisible();
    await detoxExpect(getElementByText("Ethereum")).toBeVisible();
  }

  @Step("Close Add account network drawer")
  async closeAddAccountNetworkDrawer() {
    await tapById(this.bottomSheetCloseButtonId);
    await waitForElementNotVisible(this.bottomSheetCloseButtonId);
    await waitForElementById(this.scrollViewId);
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
    await scrollToId(this.totalBalanceId, this.scrollViewId);
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
    await scrollToId(this.addressItemNameId(accountId), this.scrollViewId, 450, "down");
    await tapById(this.addressItemNameId(accountId));
  }

  @Step("Get visible Asset Detail transaction count for ticker")
  async getVisibleTransactionCountForTicker(ticker: string) {
    await this.scrollToTransactions();
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
    await this.positionTransactionForNonAndroidTap(ticker);
    await this.positionTransactionForAndroidTap(ticker);
    await detoxExpect(this.operationByTicker(ticker).atIndex(0)).toBeVisible();
    await tapByElement(this.operationByTicker(ticker).atIndex(0));
  }

  @Step("Open Asset Detail transactions history")
  async openTransactionsHistory() {
    await scrollToId(this.transactionsHeaderId, this.scrollViewId, 500, "down");
    await detoxExpect(getElementById(this.transactionsHeaderId)).toBeVisible();
    await tapByText("Transactions");
  }

  @Step("Add asset to favorites from Asset Detail")
  async addToFavorites() {
    await this.openCoinOptions("Add to favorites");
    await this.tapFavouriteRowWithText("Add to favorites");
  }

  @Step("Get favorite action label from Asset Detail")
  async getFavoriteActionLabel(expectedFavouriteText: string) {
    await this.openCoinOptions(expectedFavouriteText);
    return await getLabelOfElement(this.coinOptionsFavouriteRowId);
  }

  @Step("Close Asset Detail coin options")
  async closeCoinOptions() {
    await tapById(this.bottomSheetCloseButtonId);
    await waitForElementNotVisible(this.bottomSheetCloseButtonId);
    await waitForElementNotVisible(this.coinOptionsFavouriteRowId);
    await waitForElementById(this.coinOptionsTrailingId);
  }
}
