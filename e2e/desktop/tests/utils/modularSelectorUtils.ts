import { Page } from "@playwright/test";
import { Application } from "../page";
import { ModularDialog } from "../page/dialog/modular.dialog";

/**
 * Returns the visible modular selector (Dialog), or null if legacy UI.
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
): Promise<ModularDialog | null> {
  const page = app.getPage();

  try {
    const dialogLocator = page.getByTestId(`modular-dialog-screen-${type}_SELECTION`);
    await dialogLocator.waitFor({ state: "visible", timeout: 5000 });

    if (await dialogLocator.isVisible()) {
      return app.modularDialog;
    }
  } catch {
    // Did not appear - assume legacy UI
  }

  return null;
}

/**
 * Returns the visible modular selector (Dialog), or null if legacy UI.
 *
 * This variant accepts Page and ModularDialog instance directly,
 * useful when called from page objects that already have this instance.
 *
 * Usage:
 * ```ts
 * const selector = await getModularSelectorFromInstance(
 *   this.page,
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
export async function getModularSelectorFromInstance(
  page: Page,
  modularDialog: ModularDialog,
): Promise<ModularDialog | null> {
  try {
    const dialogLocator = page.getByTestId("modular-dialog-screen-ASSET_SELECTION");
    await dialogLocator.waitFor({ state: "visible", timeout: 5000 });

    if (await dialogLocator.isVisible()) {
      return modularDialog;
    }
  } catch {
    // Did not appear - assume legacy UI
  }

  return null;
}
