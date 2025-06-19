/* eslint-disable prettier/prettier */
import { delay, isIos, isSpeculosRemote, openDeeplink } from "../../helpers/commonHelpers";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";

export default class SwapPage {
  baseLink = "swap";
  confirmSwapOnDeviceDrawerId = "confirm-swap-on-device";
  swapSuccessTitleId = "swap-success-title";
  deviceActionLoading = "device-action-loading";
  amountReceived = "amountReceived";
  fees = "amountReceived";
  amountSent = "amountSent";
  sourceAccount = "sourceAccount";
  targetAccount = "targetAccount";
  swapProvider = "provider";
  operationRow = {
    rowBaseId: "swap-operation-row-",
    rowRegexp: new RegExp("swap-operation-row-.*"),
    baseFromAccount: "swap-history-fromAccount-",
    baseToAccount: "swap-history-toAccount-",
    baseFromAmount: "swap-history-fromAmount-",
    baseToAmount: "swap-history-toAmount-",
  }
  historyButton = "NavigationHeaderSwapHistory";
  
  operationDetails = {
    fromAccount: "swap-operationDetails-fromAccount",
    toAccount: "swap-operationDetails-toAccount",
    fromAmount: "swap-operationDetails-fromAmount",
    toAmount: "swap-operationDetails-toAmount",
    provider: "swap-operationDetails-provider",
    providerLink: "swap-operationDetails-provider-link",
    swapId: "swap-operationDetails-swapId",
    date: "swap-operationDetails-date",
    whatIsThisButton: "operationDetailsWhatIsThis-button",
    viewInExplorerButton: "operationDetailsViewInExplorer-button",
  }

  swapFormTab = () => getElementById("swap-form-tab");
  swapOperationDetailsTab = () => getWebElementById("swap-operation-details-tab");
  operationRows = () => getElementById(this.operationRow.rowBaseId);
  
  selectSpecificOperation = (swapId: string) => getElementById(`${this.operationRow.rowBaseId}${swapId}`);

  selectSpecificOperationAccountFrom = (swapId: string) => getElementById(`${this.operationRow.baseFromAccount}${swapId}`);
  selectSpecificOperationAccountTo = (swapId: string) => getElementById(`${this.operationRow.baseToAccount}${swapId}`);

  selectSpecificOperationAmountFrom = (swapId: string) => getElementById(`${this.operationRow.baseFromAccount}${swapId}`);
  selectSpecificOperationAmountTo = (swapId: string) => getElementById(`${this.operationRow.baseToAccount}${swapId}`);

  @Step("Open swap via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect swap page")
  async expectSwapPage() {
    const tab = this.swapFormTab();
    await detoxExpect(tab).toBeVisible();
  }
// =========================================
  @Step("Go to swap history")
  async goToSwapHistory() {
    await tapById(this.historyButton);
  }

  @Step("Check swap operation row details")
  async checkSwapOperation(swapId: string, provider: Provider, swap: SwapType) {

    // rebuild and test again (either with getWebElementById or getElementById)
    await detoxExpect(this.operationRows()).toBeVisible();
    await detoxExpect( this.selectSpecificOperation(swapId)).toBeVisible();

    // check values in the swap operation row
    await detoxExpect(this.selectSpecificOperationAccountFrom(swapId)).toHaveText(swap.accountToDebit.accountName);
    await detoxExpect(this.selectSpecificOperationAccountTo(swapId)).toHaveText(swap.accountToCredit.accountName);
    await detoxExpect(this.selectSpecificOperationAmountFrom(swapId)).toHaveText(swap.amount);
    await detoxExpect(this.selectSpecificOperationAmountTo(swapId)).toBeVisible();

    // check the values in swap operation details page
    // check account from
    await detoxExpect(getElementById(this.operationDetails.fromAccount)).toHaveText(swap.accountToDebit.accountName);
    // check account to
    await detoxExpect(getElementById(this.operationDetails.toAccount)).toHaveText(swap.accountToCredit.accountName);
    // check amount from
    await detoxExpect(getElementById(this.operationDetails.fromAmount)).toHaveText(swap.amount);
    // check amount to
    await detoxExpect(getElementById(this.operationDetails.toAmount)).toBeVisible();
    // check provider
    await detoxExpect(getElementById(this.operationDetails.provider)).toHaveText(getProviderName(provider.name));
    // check swapId
    await detoxExpect(getElementById(this.operationDetails.swapId)).toHaveText(swapId);
    // check date exists
    await detoxExpect(getElementById(this.operationDetails.date)).toBeVisible();
    
    // check external links
    await detoxExpect(getElementById(this.operationDetails.providerLink)).toBeVisible();
    await detoxExpect(getElementById(this.operationDetails.viewInExplorerButton)).toBeVisible();
  }

  @Step("Open selected operation by swapId: $0")
  async openSelectedOperation(swapId: string) {
    await this.selectSpecificOperation(swapId).tap();
  }

  @Step("Verify swap operation details")
  async expectSwapDrawerInfos(swapId: string, swap: SwapType, provider: Provider) {
    // await this.waitForDrawerToBeVisible();
    waitForElementById("swap-operation-details-tab");

    // expect(await this.swapDrawerTitle.textContent()).toMatch("Swap");
    jestExpect(await swapOperationDetailsTab.getT).toMatch("Swap ID");

    await expect(this.swapIdLabel).toBeVisible();
    expect(await this.swapIdValue.textContent()).toMatch(swapId);
    await expect(this.swapStatus).toBeVisible();
    expect(await this.swapStatus.textContent()).toMatch(/pending|finished/);
    expect(await this.dateValue.textContent()).toMatch(
      /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/,
    );
    expect(await this.swapFromAccount.textContent()).toMatch(swap.accountToDebit.accountName);
    expect(await this.swapAmountSent.textContent()).toContain(swap.amount);
    expect(await this.swapToAccount.textContent()).toMatch(swap.accountToCredit.accountName);
    await expect(this.swapAmountReceived).toBeVisible();

    expect(await this.swapProviderLink.textContent()).toContain(provider.uiName);
    await expect(this.swapOperationDetailsLink).toBeVisible();
  }
// =========================================
  @Step("Verify the amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: SwapType, amount: string) {
    await waitForElementById(this.confirmSwapOnDeviceDrawerId);
    await app.speculos.verifyAmountsAndAcceptSwap(swap, amount);
    await this.delayDeviceActionLoadingCheck();
    await waitForElementNotVisible(this.deviceActionLoading);
  }

  @Step("Verify the amounts and reject swap")
  async verifyAmountsAndRejectSwap(swap: SwapType, amount: string) {
    await waitForElementById(this.confirmSwapOnDeviceDrawerId);
    await app.speculos.verifyAmountsAndRejectSwap(swap, amount);
    await this.delayDeviceActionLoadingCheck();
    await waitForElementNotVisible(this.deviceActionLoading);
  }

  @Step("Wait for swap success and continue")
  async waitForSuccessAndContinue() {
    await waitForElementById(this.swapSuccessTitleId);
    await tapById(app.common.proceedButtonId);
  }
  async delayDeviceActionLoadingCheck() {
    //ISSUE: LIVE-19300
    await delay(isSpeculosRemote() && isIos() ? 45_000 : 20_000);
  }

  @Step("Get amount to receive")
  async getAmountToReceive() {
    return (await getTextOfElement(this.amountReceived)).trim();
  }

  @Step("Get fees")
  async getFees() {
    return (await getTextOfElement(this.fees)).trim();
  }

  @Step("Verify amount to receive: $0")
  async verifyAmountToReceive(amount: string) {
    const received = (await getTextOfElement(this.amountReceived)).replace(/\s/g, "");
    const expected = amount.replace(/\s/g, "");
    jestExpect(received).toBe(expected);
  }

  @Step("Verify amount to send: $0")
  async verifyAmountSent(amount: string, currency: string) {
    const received = (await getTextOfElement(this.amountSent)).replace(/\s/g, "");
    const expected = `${amount} ${currency}`.replace(/\s/g, "");
    jestExpect(received).toBe(expected);
  }

  @Step("Verify source currency: $0")
  async verifySourceAccount(sourceCurrency: string) {
    jestExpect((await getTextOfElement(this.sourceAccount)).trim()).toMatch(sourceCurrency);
  }

  @Step("Verify target currency: $0")
  async verifyTargetCurrency(targetCurrency: string) {
    jestExpect((await getTextOfElement(this.targetAccount)).trim()).toMatch(targetCurrency);
  }

  @Step("Verify provider: $0")
  async verifyProvider(provider: string) {
    jestExpect((await getTextOfElement(this.swapProvider)).trim()).toMatch(provider);
  }
}
