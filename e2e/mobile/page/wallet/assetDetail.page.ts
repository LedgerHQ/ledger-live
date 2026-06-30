import { element, by } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { OPERATION_ITEM_ID } from "./operation.page";

const ASSET_DETAIL_TOTAL_BALANCE_AMOUNT_ID = "asset-detail-total-balance-amount";
const ASSET_DETAIL_MARKET_PRICE_ID = "asset-detail-market-price";

export default class AssetDetailPage {
  @Step("Expect asset detail balance to be visible")
  async expectTotalBalanceVisible() {
    await waitForElementById(ASSET_DETAIL_TOTAL_BALANCE_AMOUNT_ID);
  }

  @Step("Expect asset detail market price to be visible")
  async expectMarketPriceVisible() {
    await waitForElementById(ASSET_DETAIL_MARKET_PRICE_ID);
  }

  @Step("Expect asset detail operation item to be visible")
  async expectOperationItemVisible() {
    await scrollToId(OPERATION_ITEM_ID, undefined, undefined);
    await detoxExpect(element(by.id(OPERATION_ITEM_ID)).atIndex(0)).toBeVisible();
  }
}
