import { Page } from "@playwright/test";
import { Application } from "../page";
import { ModularDrawer } from "../page/drawer/modular.drawer";
import { ModularDialog } from "../page/dialog/modular.dialog";

/**
 * Common interface for ModularDrawer and ModularDialog.
 * Both classes implement these methods with the same signature.
 */
export type ModularSelector = ModularDrawer | ModularDialog;

/**
 * Returns the visible modular ASSET selector (Dialog or Drawer), or null if legacy UI.
 * Priority: dialog > drawer > null (legacy)
 *
 * Uses Playwright's .or() locator to efficiently wait for either selector to appear.
 *
 * Usage:
 * ```ts
 * const selector = await getModularSelector(app, "ASSET");
 * if (selector) {
 *   await selector.validateItems();
 *   await selector.selectAsset(currency);
 *   await selector.selectNetwork(currency);
 * } else {
 *   // legacy flow
 * }
 * ```
 */
export async function getModularSelector(
  app: Application,
  type: "ASSET" | "ACCOUNT",
): Promise<ModularSelector | null> {
  const page = app.getPage();

  try {
    const dialogLocator = page.getByTestId(`modular-dialog-screen-${type}_SELECTION`);
    const drawerLocator = page.getByTestId(`modular-drawer-screen-${type}_SELECTION`);

    // Wait for either dialog or drawer to appear (whichever comes first)
    await dialogLocator.or(drawerLocator).waitFor({ state: "visible", timeout: 5000 });

    // Check which one is visible (priority: dialog > drawer)
    if (await dialogLocator.isVisible()) {
      return app.modularDialog;
    }
    if (await drawerLocator.isVisible()) {
      return app.modularDrawer;
    }
  } catch {
    // Neither appeared - assume legacy UI
  }

  return null;
}

/**
 * Returns the visible modular ASSET selector (Dialog or Drawer), or null if legacy UI.
 * Priority: dialog > drawer > null (legacy)
 *
 * This variant accepts Page and ModularDrawer/ModularDialog instances directly,
 * useful when called from page objects that already have these instances.
 *
 * Uses Playwright's .or() locator to efficiently wait for either selector to appear.
 *
 * Usage:
 * ```ts
 * const selector = await getModularSelectorFromInstances(
 *   this.page,
 *   this.modularDrawer,
 *   this.modularDialog
 * );
 * if (selector) {
 *   await selector.validateItems();
 *   await selector.selectAsset(currency);
 *   await selector.selectNetwork(currency);
 * } else {
 *   // legacy flow
 * }
 * ```
 */
export async function getModularSelectorFromInstances(
  page: Page,
  modularDrawer: ModularDrawer,
  modularDialog: ModularDialog,
): Promise<ModularSelector | null> {
  try {
    const dialogLocator = page.getByTestId("modular-dialog-screen-ASSET_SELECTION");
    const drawerLocator = page.getByTestId("modular-drawer-screen-ASSET_SELECTION");

    // Wait for either dialog or drawer to appear (whichever comes first)
    await dialogLocator.or(drawerLocator).waitFor({ state: "visible", timeout: 5000 });

    // Check which one is visible (priority: dialog > drawer)
    if (await dialogLocator.isVisible()) {
      return modularDialog;
    }
    if (await drawerLocator.isVisible()) {
      return modularDrawer;
    }
  } catch {
    // Neither appeared - assume legacy UI
  }

  return null;
}
