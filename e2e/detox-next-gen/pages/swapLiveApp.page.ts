/**
 * Swap Live App — a React web app rendered inside the live-app WebView.
 *
 * Demonstrates a *webview* page object: all interactions go through the
 * `WebSurface` scoped to its WebView host (inherited from {@link LiveAppPage}),
 * so this PO never touches the generic web helpers' singleton and stays
 * correct even if a second webview is on screen.
 *
 * Locators are action-ready handles built via `this.web.testId(...)` /
 * `this.web.css(...)` — the match strategy (testID vs CSS) is explicit at
 * definition. Methods use the lib default timeout unless the step is
 * genuinely slow (quotes, on-device/on-chain), in which case it overrides it.
 */
import { device } from "detox";
import { WebHandle } from "../helpers/elements";
import { TIMEOUTS } from "../helpers/timeouts";
import { LiveAppPage } from "./liveApp.page";

type Percentage = "25%" | "50%" | "75%" | "max";

export class SwapLiveAppPage extends LiveAppPage {
  private readonly deeplink = "ledgerlive://swap";

  private readonly fromSelector = this.web.testId("from-account-coin-selector");
  private readonly toSelector = this.web.testId("to-account-coin-selector");
  private readonly fromAmountInput = this.web.testId("from-account-amount-input");
  private readonly getQuotesButton = this.web.testId("mobile-get-quotes-button");
  private readonly stepApprovalButton = this.web.testId("execute-swap-button-step-approval");
  private readonly anyProviderCard = this.web.css(
    "[data-testid^='compact-quote-card-provider-name-']",
  );

  private readonly percentageToggle = (p: Percentage): WebHandle =>
    this.web.testId(`mobile-keyboard-percentage-${p}`);
  private readonly providerCard = (name: string): WebHandle =>
    this.web.testId(`compact-quote-card-provider-name-${name}`);
  private readonly executeButton = (name: string): WebHandle =>
    this.web.css(`[data-testid^="quote-container-${name}"] [data-testid="execute-button"]`);

  /** Open the Swap Live App via deeplink and wait for the form to render. */
  async openViaDeeplink(): Promise<void> {
    await device.openURL({ url: this.deeplink });
    await this.fromSelector.wait();
  }

  /** Wait for the swap form to be present. */
  async expectForm(): Promise<void> {
    await this.fromSelector.wait();
  }

  /** Tap the "from" coin selector (opens the native modular drawer). */
  async tapFromSelector(): Promise<void> {
    await this.fromSelector.tap();
  }

  /** Tap the "to" coin selector (opens the native modular drawer). */
  async tapToSelector(): Promise<void> {
    await this.toSelector.tap();
  }

  /** Populate the amount via a percentage toggle on the keypad. */
  async setPercentage(p: Percentage): Promise<void> {
    await this.percentageToggle(p).tap();
  }

  /** Read the currently displayed "you send" amount. */
  async getSendAmount(): Promise<string> {
    return this.fromAmountInput.getValue();
  }

  /** Request quotes. */
  async getQuotes(): Promise<void> {
    await this.getQuotesButton.tap();
  }

  /**
   * Bring the quote cards into view: the keypad overlays the lower screen
   * and relabels this same button to "View quotes".
   */
  async viewQuotes(): Promise<void> {
    await this.getQuotesButton.tap({ scroll: true });
  }

  /** Wait for at least one provider quote card to appear. */
  async waitForAnyQuote(timeout = TIMEOUTS.M): Promise<void> {
    await this.anyProviderCard.wait({ timeout });
  }

  /** Wait for a specific provider's quote card to appear (fail fast if it doesn't quote this pair). */
  async waitForProvider(name: string, timeout = TIMEOUTS.M): Promise<void> {
    await this.providerCard(name).wait({ timeout });
  }

  /** True if a specific provider returned a quote card. */
  async hasProvider(name: string): Promise<boolean> {
    return this.providerCard(name).exists();
  }

  /** Select a provider's quote card. */
  async selectProvider(name: string): Promise<void> {
    await this.providerCard(name).tap({ scroll: true });
  }

  /** Wait for a provider's Execute button and scroll it into view (sync stays on). */
  async waitForExecuteReady(name: string): Promise<void> {
    const button = this.executeButton(name);
    await button.wait();
    await button.scrollIntoView();
  }

  /** Tap a provider's Execute button (call after {@link waitForExecuteReady}). */
  async tapExecute(name: string): Promise<void> {
    await this.executeButton(name).tap();
  }

  /** Tap the "Sign to swap" button on the step-approval screen (DEX flow). */
  async confirmStepApproval(): Promise<void> {
    await this.stepApprovalButton.tap({ scroll: true });
  }

  /** Wait for the step-approval button to reappear (DEX flow returns here after signing). */
  async expectBackOnStepApproval(timeout = TIMEOUTS.L): Promise<void> {
    await this.stepApprovalButton.wait({ timeout });
  }
}
