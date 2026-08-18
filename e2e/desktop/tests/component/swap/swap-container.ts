import { expect, Locator } from "@playwright/test";
import { step } from "tests/misc/reporters/step";

// TODO: migrate the swap logic from `tests/page/swap.page.ts` into this component.
export class SwapContainer {
  readonly root: Locator;
  private readonly swapSurface: "embedded" | "full";

  constructor(ledgerLiveRoot: Locator, swapSurface: "embedded" | "full" = "full") {
    this.swapSurface = swapSurface;
    this.root = ledgerLiveRoot.getByTestId(`swap-web-app-container-${swapSurface}`);
  }

  @step("expect swap container to be visible")
  async expectSwapContainerVisible() {
    await expect(
      this.root,
      `expect ${this.swapSurface} swap container to be visible`,
    ).toBeVisible();
  }
}
