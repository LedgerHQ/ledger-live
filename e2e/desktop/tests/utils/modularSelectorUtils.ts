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
 * Returns a combined locator that matches either the modular dialog or drawer for a given type.
 * Useful for fluent assertions like `await expect(getModularLocator(page, "ACCOUNT")).toBeHidden()`.
 */
export function getModularLocator(page: Page, type: "ASSET" | "ACCOUNT") {
  return page
    .getByTestId(`modular-dialog-screen-${type}_SELECTION`)
    .or(page.getByTestId(`modular-drawer-screen-${type}_SELECTION`));
}

/**
 * Returns the visible modular selector (Dialog or Drawer), or null if legacy UI.
 * Priority: dialog > drawer > null (legacy)
 *
 * This variant accepts Page and ModularDialog instance directly,
 * useful when called from page objects that already have this instance.
 *
 * Usage:
 * ```ts
 * const selector = await getModularSelectorFromInstance(
 *   this.page,
 *   this.modularDrawer,
 *   this.modularDialog,
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
