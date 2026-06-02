/** Ledger detox APK webview context (see Appium logs: WEBVIEW_com.ledger.live.detox). */
export const LEDGER_SWAP_WEBVIEW = "WEBVIEW_com.ledger.live.detox";

export const NATIVE_APP_CONTEXT = "NATIVE_APP";

export async function getCurrentAppiumContext(): Promise<string> {
  const context = await driver.getAppiumContext();
  return typeof context === "string" ? context : String(context);
}

/** Avoids redundant setContext calls — each one re-runs webview discovery (CDP, adb ps, forwards). */
export async function switchAppiumContextIfNeeded(context: string): Promise<void> {
  if ((await getCurrentAppiumContext()) === context) {
    return;
  }
  await driver.switchAppiumContext(context);
}

export async function switchToNativeApp(): Promise<void> {
  await switchAppiumContextIfNeeded(NATIVE_APP_CONTEXT);
}

export async function switchToSwapWebview(): Promise<void> {
  await switchAppiumContextIfNeeded(LEDGER_SWAP_WEBVIEW);
}
