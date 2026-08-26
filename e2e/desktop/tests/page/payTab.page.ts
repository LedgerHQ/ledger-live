import { expect, Locator } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

/**
 * The Pay tab (`/paytab`).
 *
 * The balance hero renders one of two mutually exclusive states, and the action tiles live **only**
 * in the funded one: `hasBalance` is `stablecoins.some(({ value }) => value > 0)`, so a portfolio
 * with no stablecoin holdings shows the empty state and no tiles at all. Both are exposed here so a
 * test can assert which one it is looking at rather than infer it from a missing element.
 */
export class PayTabPage extends AppPage {
  private readonly fundedState: Locator = this.page.getByTestId("pay-card-balance-funded-state");
  private readonly emptyState: Locator = this.page.getByTestId("pay-card-balance-empty-state");
  private readonly balanceAmount: Locator = this.page.getByTestId("pay-card-balance-amount");
  private readonly actionTiles: Locator = this.page.getByTestId("action-tiles");

  private actionTile(id: "deposit" | "request" | "pay"): Locator {
    return this.page.getByTestId(`action-tile-${id}`);
  }

  @step("Wait for the Pay tab balance to settle")
  async waitForBalance() {
    // `isFunded` is true while loading, so the tiles flash before the empty state resolves. Waiting
    // on either terminal state avoids asserting against that intermediate frame.
    await expect(this.fundedState.or(this.emptyState)).toBeVisible();
  }

  @step("Expect the Pay tab to show a funded balance")
  async expectFundedBalance() {
    await expect(this.fundedState).toBeVisible();
    await expect(this.balanceAmount).toBeVisible();
    await expect(this.emptyState).not.toBeVisible();
  }

  @step("Expect the Pay tab to show the empty balance state")
  async expectEmptyBalance() {
    await expect(this.emptyState).toBeVisible();
    await expect(this.fundedState).not.toBeVisible();
  }

  @step("Expect the deposit, request and pay action tiles")
  async expectActionTiles() {
    await expect(this.actionTiles).toBeVisible();
    for (const id of ["deposit", "request", "pay"] as const) {
      await expect(this.actionTile(id)).toBeVisible();
    }
  }
}
