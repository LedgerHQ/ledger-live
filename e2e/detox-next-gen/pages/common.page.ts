/**
 * Base page object — holds only what's genuinely common to every screen
 * (currently the shared primary CTAs). Native pages `extends CommonPage`;
 * webview-hosted pages extend {@link LiveAppPage} (which extends this).
 */
import { ActionOpts, byText } from "../helpers/elements";

export class CommonPage {
  /**
   * Shared primary CTAs. Text-matched on purpose: the underlying legacy RN
   * buttons' `testID` doesn't propagate on iOS.
   */
  private readonly continueCta = byText("Continue");
  private readonly confirmCta = byText("Confirm");

  /** Wait for the shared primary "Continue" CTA to be visible (without tapping). */
  async expectContinue(opts?: ActionOpts): Promise<void> {
    await this.continueCta.waitVisible(opts);
  }

  /** Tap the shared primary "Continue" CTA. */
  async tapContinue(opts?: ActionOpts): Promise<void> {
    await this.continueCta.tap(opts);
  }

  /** Tap the shared primary "Confirm" CTA. */
  async tapConfirm(opts?: ActionOpts): Promise<void> {
    await this.confirmCta.tap(opts);
  }
}
