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

  // Amounts/details render behind a loading Skeleton until the swap status view-model resolves,
  // so the underlying text can briefly be empty right after the drawer opens: poll instead of reading once.
  private async expectTextEventually(id: string, matcher: (text: string) => void) {
    await retryUntilTimeout(async () => {
      matcher(normalizeText(await getTextOfElement(id)));
    });
  }

  @Step("Verify swap transaction status drawer information")
  async expectSwapTransactionStatusDrawerInfos(
    swapIdPrefix: string,
    provider: SwapProvider,
    details: SwapTransactionStatusDetails,
  ) {
    await waitForElementById(this.titleId);
    await this.expectTextEventually(this.dateId, text =>
      jestExpect(text).toContain(normalizeText(details.date)),
    );

    await detoxExpect(getElementById(this.sendRowId)).toBeVisible();
    await this.expectTextEventually(this.sentAmountId, text =>
      jestExpect(text).toEqual(normalizeText(details.sentAmount)),
    );

    await detoxExpect(getElementById(this.receiveRowId)).toBeVisible();
    if (details.receivedAmount) {
      const receivedAmount = normalizeText(details.receivedAmount);
      await this.expectTextEventually(this.receivedAmountId, text =>
        jestExpect(text).toEqual(receivedAmount),
      );
    } else {
      await detoxExpect(getElementById(this.receivedAmountId)).toBeVisible();
    }

    await retryUntilTimeout(() => scrollToId(this.networkFeesId, this.scrollViewId));
    await this.expectTextEventually(this.networkFeesId, text =>
      jestExpect(text).toEqual(normalizeText(details.networkFees)),
    );
    await this.expectTextEventually(this.receiveAccountId, text =>
      jestExpect(text).toContain(normalizeText(details.receiveAccount)),
    );
    await this.expectTextEventually(this.providerId, text =>
      jestExpect(text).toEqual(normalizeText(provider.uiName)),
    );
    await this.expectTextEventually(this.swapIdId, text =>
      jestExpect(text).toContain(swapIdPrefix),
    );

    await retryUntilTimeout(() => scrollToId(this.viewInExplorerButtonId, this.scrollViewId));
    await detoxExpect(getElementById(this.viewInExplorerButtonId)).toBeVisible();
  }
}
