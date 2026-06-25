/**
 * Base for pages hosted inside the Wallet-API live-app WebView (Swap,
 * Buy/Sell, Earn, …). Owns the app-specific webview-host testID and exposes
 * a `WebSurface` scoped to it, so subclasses only declare their locators
 * (`this.web.testId(...)` / `this.web.css(...)`).
 *
 * The webview-host testID lives here on purpose — not on {@link CommonPage}
 * (most pages aren't webviews) and not in the generic `helpers/elements` lib
 * (which stays app-agnostic).
 */
import { by } from "detox";
import { webView, WebSurface } from "../helpers/elements";
import { CommonPage } from "./common.page";

export abstract class LiveAppPage extends CommonPage {
  /** Web helpers scoped to the Wallet-API live-app WebView host. */
  protected readonly web: WebSurface = webView(by.id("wallet-api-webview"));
}
