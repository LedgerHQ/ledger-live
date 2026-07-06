import { Step } from "jest-allure2-reporter/api";
import { normalizeText } from "../../helpers/commonHelpers";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { retryUntilTimeout } from "../../utils/retry";

export type SwapTransactionStatusDetails = {
  date: string;
  sentAmount: string;
  // Received amount depends on a live-computed final amount, not just the fixture's raw value: leave unset to only assert visibility.
  receivedAmount?: string;
  networkFees: string;
  receiveAccount: string;
};

export default class SwapTransactionStatusDrawer {
  scrollViewId = "swap-transaction-status-scroll-view";
  titleId = "swap-transaction-title";
  dateId = "swap-transaction-date";
  sendRowId = "swap-transaction-status-send-row";
  receiveRowId = "swap-transaction-status-receive-row";
  sentAmountId = "swap-transaction-status-send-amount";
  receivedAmountId = "swap-transaction-status-receive-amount";
  networkFeesId = "swap-transaction-details-network-fees";
  receiveAccountId = "swap-transaction-details-receive-account";
  providerId = "swap-transaction-details-provider";
  swapIdId = "swap-transaction-details-swap-id";
  viewInExplorerButtonId = "swap-transaction-view-explorer-btn";

  @Step("Verify swap transaction status drawer information")
  async expectSwapTransactionStatusDrawerInfos(
    swapIdPrefix: string,
    provider: SwapProvider,
    details: SwapTransactionStatusDetails,
  ) {
    // Every value here only mounts its testID once resolved (a Skeleton renders otherwise), so
    // getTextOfElement's built-in retry-until-exists already guarantees the text is final once found.
    await waitForElementById(this.titleId);
    jestExpect(normalizeText(await getTextOfElement(this.dateId))).toContain(
      normalizeText(details.date),
    );

    await detoxExpect(getElementById(this.sendRowId)).toBeVisible();
    jestExpect(normalizeText(await getTextOfElement(this.sentAmountId))).toEqual(
      normalizeText(details.sentAmount),
    );

    await detoxExpect(getElementById(this.receiveRowId)).toBeVisible();
    if (details.receivedAmount) {
      jestExpect(normalizeText(await getTextOfElement(this.receivedAmountId))).toEqual(
        normalizeText(details.receivedAmount),
      );
    } else {
      await detoxExpect(getElementById(this.receivedAmountId)).toBeVisible();
    }

    await retryUntilTimeout(() => scrollToId(this.networkFeesId, this.scrollViewId));
    jestExpect(normalizeText(await getTextOfElement(this.networkFeesId))).toEqual(
      normalizeText(details.networkFees),
    );
    jestExpect(normalizeText(await getTextOfElement(this.receiveAccountId))).toContain(
      normalizeText(details.receiveAccount),
    );
    jestExpect(normalizeText(await getTextOfElement(this.providerId))).toEqual(
      normalizeText(provider.uiName),
    );
    jestExpect(normalizeText(await getTextOfElement(this.swapIdId))).toContain(swapIdPrefix);

    await retryUntilTimeout(() => scrollToId(this.viewInExplorerButtonId, this.scrollViewId));
    await detoxExpect(getElementById(this.viewInExplorerButtonId)).toBeVisible();
  }
}
