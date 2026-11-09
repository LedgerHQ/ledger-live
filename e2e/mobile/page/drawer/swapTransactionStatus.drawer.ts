import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { TIMEOUT } from "@e2e/utils/timeouts";

export type SwapTransactionStatusDetails = {
  date: string;
  sentAmount: string;
  // Received amount depends on a live-computed final amount, not just the fixture's raw value: leave unset to only assert visibility.
  receivedAmount?: string;
  networkFees: string;
  receiveAccount: string;
  providerUrl?: string;
};

export default class SwapTransactionStatusDrawer {
  private readonly scrollView = byId("swap-transaction-status-scroll-view");
  private readonly title = byId("swap-transaction-title");
  private readonly date = byId("swap-transaction-date");
  private readonly sendRow = byId("swap-transaction-status-send-row");
  private readonly receiveRow = byId("swap-transaction-status-receive-row");
  private readonly sentAmount = byId("swap-transaction-status-send-amount");
  private readonly receivedAmount = byId("swap-transaction-status-receive-amount");
  private readonly networkFees = byId("swap-transaction-details-network-fees");
  private readonly receiveAccount = byId("swap-transaction-details-receive-account");
  private readonly provider = byId("swap-transaction-details-provider");
  private readonly providerLink = byId("swap-transaction-details-provider-link");
  private readonly swapId = byId("swap-transaction-details-swap-id");
  private readonly viewInExplorerButton = byId("swap-transaction-view-explorer-btn");

  @Step("Verify swap transaction status drawer information {{{0}}}")
  async expectSwapTransactionStatusDrawerInfos(
    swapIdPrefix: string,
    provider: SwapProvider,
    details: SwapTransactionStatusDetails,
  ) {
    // Every value here only mounts its testID once resolved (a Skeleton renders otherwise), so
    // the wait inside getText already guarantees the text is final once found.
    await this.title.waitVisible();
    await this.date.expectText(details.date, { normaliseWhitespace: true, containing: true });

    await this.sendRow.expectVisible();
    await this.sentAmount.expectText(details.sentAmount, { normaliseWhitespace: true });

    await this.receiveRow.expectVisible();
    if (details.receivedAmount) {
      await this.receivedAmount.expectText(details.receivedAmount, { normaliseWhitespace: true });
    } else {
      await this.receivedAmount.expectVisible();
    }

    await this.networkFees.waitExist(TIMEOUT.xxlarge);
    await this.networkFees.scrollTo(this.scrollView);
    await this.networkFees.expectText(details.networkFees, { normaliseWhitespace: true });
    // Reading the text waits for visibility, so each detail row is scrolled to first.
    await this.receiveAccount.scrollTo(this.scrollView);
    await this.receiveAccount.expectText(details.receiveAccount, {
      normaliseWhitespace: true,
      containing: true,
    });
    await this.provider.scrollTo(this.scrollView);
    await this.provider.expectText(provider.uiName, { normaliseWhitespace: true });
    if (details.providerUrl) {
      await this.providerLink.scrollTo(this.scrollView);
      await this.providerLink.expectVisible();
      await this.providerLink.expectAccessibilityValue(details.providerUrl, { containing: true });
    } else {
      await this.providerLink.expectNotExist();
    }
    await this.swapId.scrollTo(this.scrollView);
    await this.swapId.expectText(swapIdPrefix, { normaliseWhitespace: true, containing: true });

    await this.viewInExplorerButton.waitExist(TIMEOUT.xxlarge);
    await this.viewInExplorerButton.scrollTo(this.scrollView);
    await this.viewInExplorerButton.expectVisible();
  }
}
