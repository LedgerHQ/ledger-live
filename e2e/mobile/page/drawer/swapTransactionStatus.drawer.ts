import { Step } from "jest-allure2-reporter/api";
import { normalizeText, isIos } from "../../helpers/commonHelpers";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { DEFAULT_TIMEOUT } from "../../helpers/elementHelpers";

export type SwapTransactionStatusDetails = {
  date: string;
  sentAmount: string;
  // Received amount depends on a live-computed final amount, not just the fixture's raw value: leave unset to only assert visibility.
  receivedAmount?: string;
  networkFees: string;
  receiveAccount: string;
  // Present when the provider is expected to expose a website link; absent when it should show name-only.
  providerUrl?: string;
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
  providerLinkId = "swap-transaction-details-provider-link";
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

    await waitForElementById(this.networkFeesId, DEFAULT_TIMEOUT, { checkVisibility: false });
    await scrollToId(this.networkFeesId, this.scrollViewId);
    jestExpect(normalizeText(await getTextOfElement(this.networkFeesId))).toEqual(
      normalizeText(details.networkFees),
    );
    jestExpect(normalizeText(await getTextOfElement(this.receiveAccountId))).toContain(
      normalizeText(details.receiveAccount),
    );
    jestExpect(normalizeText(await getTextOfElement(this.providerId))).toEqual(
      normalizeText(provider.uiName),
    );
    // Only providers with a configured URL render the provider name as a link (QAA-721 / LIVE-18412).
    // Verify the link (and its URL) when expected; assert its absence otherwise.
    if (details.providerUrl) {
      await scrollToId(this.providerLinkId, this.scrollViewId);
      await detoxExpect(getElementById(this.providerLinkId)).toBeVisible();
      const { value, label } = await getAttributesOfElement(this.providerLinkId);
      if (isIos()) {
        jestExpect(value).toContain(details.providerUrl);
      } else {
        jestExpect(label).toContain(details.providerUrl);
      }
    } else {
      await detoxExpect(getElementById(this.providerLinkId)).not.toExist();
    }
    jestExpect(normalizeText(await getTextOfElement(this.swapIdId))).toContain(swapIdPrefix);

    await waitForElementById(this.viewInExplorerButtonId, DEFAULT_TIMEOUT, {
      checkVisibility: false,
    });
    await scrollToId(this.viewInExplorerButtonId, this.scrollViewId);
    await detoxExpect(getElementById(this.viewInExplorerButtonId)).toBeVisible();
  }
}
