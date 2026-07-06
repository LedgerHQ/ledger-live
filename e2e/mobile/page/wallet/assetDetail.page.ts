import { Step } from "jest-allure2-reporter/api";
import { normalizeText } from "../../helpers/commonHelpers";

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
  totalBalanceId = "asset-detail-total-balance";

  addressItemId = (accountId: string) => `asset-detail-address-item-${accountId}`;

  private async scrollToAddressItem(accountId: string) {
    await scrollToId(this.addressItemId(accountId), undefined, 450, "down");
    await waitForElementById(this.addressItemId(accountId), 10_000, {
      checkVisibility: false,
    });
  }

  private async getVisibleTickerAmount(ticker: string) {
    const tickerAmountRegex = new RegExp(String.raw`\d+(?:\.\d+)?\s*${escapeRegExp(ticker)}`);
    const attributes = await getElementByText(tickerAmountRegex, 0).getAttributes();
    const text = "elements" in attributes ? attributes.elements[0]?.text : attributes.text;
    const label = "elements" in attributes ? attributes.elements[0]?.label : attributes.label;
    return parseTickerAmount(String(text || label || ""), ticker);
  }

  private async getHoldingAddressLabel(accountId: string) {
    await this.scrollToAddressItem(accountId);
    return normalizeText(await getLabelOfElement(this.addressItemId(accountId)));
  }

  private async getHoldingAddressBalance(accountId: string, ticker: string) {
    return parseTickerAmount(await this.getHoldingAddressLabel(accountId), ticker);
  }

  @Step("Expect Asset Detail page for ticker")
  async expectAssetDetailPageForTicker(ticker: string) {
    await waitForElementById(this.screenId, undefined, { checkVisibility: false });
    await scrollToId(this.totalBalanceId);
    jestExpect(await this.getVisibleTickerAmount(ticker)).toBeGreaterThan(0);
  }

  @Step("Expect Asset Detail total crypto balance for ticker")
  async expectTotalBalanceCryptoForTicker(ticker: string) {
    await scrollToId(this.totalBalanceId);
    jestExpect(await this.getVisibleTickerAmount(ticker)).toBeGreaterThan(0);
  }

  @Step("Expect holding address details")
  async expectHoldingAddressDetails(expectedAddresses: HoldingAddressExpectation[], ticker: string) {
    for (const expectedAddress of expectedAddresses) {
      const addressLabel = await this.getHoldingAddressLabel(expectedAddress.accountId);
      jestExpect(addressLabel).toContain(expectedAddress.name);

      if (expectedAddress.addressFragment) {
        jestExpect(addressLabel.toLowerCase()).toContain(
          expectedAddress.addressFragment.toLowerCase(),
        );
      }

      jestExpect(addressLabel).toMatch(/\$\d/);
      jestExpect(parseTickerAmount(addressLabel, ticker)).toBeGreaterThan(0);
    }
  }

  @Step("Expect holding address balances to add up to total")
  async expectHoldingAddressBalancesSumToTotal(accountIds: string[], ticker: string) {
    await scrollToId(this.totalBalanceId);
    const totalBalance = await this.getVisibleTickerAmount(ticker);

    let holdingBalance = 0;
    for (const accountId of accountIds) {
      const accountBalance = await this.getHoldingAddressBalance(accountId, ticker);
      jestExpect(accountBalance).toBeGreaterThan(0);
      holdingBalance += accountBalance;
    }

    jestExpect(holdingBalance).toBeCloseTo(totalBalance, TOKEN_BALANCE_DECIMAL_PRECISION);
    return { holdingBalance, totalBalance };
  }
}
