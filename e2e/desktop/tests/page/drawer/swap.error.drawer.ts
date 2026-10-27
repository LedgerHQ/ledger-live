import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

/** Opened by Ledger Wallet when the swap live app reports an error, e.g. a failed swap init. */
export class SwapErrorDrawer extends Drawer {
  @step("Wait for the swap error drawer to finish opening")
  async waitUntilOpen() {
    await expect(this.content).toBeInViewport({ ratio: 1, timeout: TIMEOUT.small });
  }
}
