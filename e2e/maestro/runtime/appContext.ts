import { MaestroApp } from "../pages/app";
import { ModularDrawerPage } from "../pages/modularDrawer";
import { PortfolioPage } from "../pages/portfolio";
import { SwapPage } from "../pages/swap";
import { WebViewHelper } from "./webView";

/**
 * Identifiers for the live apps the test runner knows how to drive.
 * Each entry maps to the manifest id baked into the live-app's `data-testid`
 * registry on the app side. Add new entries when wiring up additional
 * live apps (Earn, Buy/Sell, etc.).
 */
export type LiveAppName = "swap";

type LiveAppDescriptor = {
  /** Manifest id used to look up the registered WebView injector in-app. */
  manifestId: string;
};

const LIVE_APP_DESCRIPTORS: Record<LiveAppName, LiveAppDescriptor> = {
  swap: {
    manifestId:
      process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws",
  },
};

export interface LiveAppHandle {
  readonly name: LiveAppName;
  readonly manifestId: string;
  readonly webView: WebViewHelper;
}

export interface NativeAppHandle {
  readonly app: MaestroApp;
  readonly modularDrawer: ModularDrawerPage;
  readonly portfolio: PortfolioPage;
  readonly swap: SwapPage;
}

/**
 * Explicit context switcher for tests that move between a live app
 * (DOM driven via the in-app webview-driver bridge) and the native app
 * (Maestro testID / text / coordinate matching).
 *
 * This does NOT change the simulator's state — Maestro always sees the
 * whole screen tree. The switcher exists to:
 *
 *   1. Make the test choreography explicit. Reading a spec, you can tell
 *      at a glance which surface is being driven for each step.
 *   2. Centralise the per-context warmup so quirks of each surface
 *      (iOS sheet animations, WebView load timing, etc.) are handled
 *      in one place rather than sprinkled across page objects.
 *   3. Stay future-proof for additional live apps — adding Earn / Buy-Sell
 *      is just a new entry in `LIVE_APP_DESCRIPTORS`.
 */
export class AppContextSwitcher {
  constructor(
    private readonly app: MaestroApp,
    private readonly modularDrawer: ModularDrawerPage,
    private readonly portfolio: PortfolioPage,
    private readonly swap: SwapPage,
  ) {}

  async switchToLiveApp(name: LiveAppName): Promise<LiveAppHandle> {
    const descriptor = LIVE_APP_DESCRIPTORS[name];
    if (!descriptor) {
      throw new Error(
        `[appContext] Unknown live app "${name}". Known: ${Object.keys(LIVE_APP_DESCRIPTORS).join(", ")}`,
      );
    }
    console.info(`[appContext] → live app "${name}" (manifest=${descriptor.manifestId})`);

    // Make sure the WebView is actually on screen before letting the caller
    // drive its DOM. If the live app failed to load we want a clear, early
    // failure, not a series of mysterious webview-driver timeouts.
    await this.swap.expectWalletApiWebview(10_000);

    return {
      name,
      manifestId: descriptor.manifestId,
      webView: new WebViewHelper(descriptor.manifestId),
    };
  }

  async switchToNativeApp(): Promise<NativeAppHandle> {
    console.info("[appContext] → native app");

    // When the native context is reached after a live-app trigger
    // (e.g. account.request opens the modular drawer over the WebView),
    // give iOS sheet animations time to settle so XCUITest can refresh
    // its accessibility tree before we start matching elements.
    await this.app
      .runNativeFlow("settle-native-context", [
        {
          waitForAnimationToEnd: {
            timeout: 5_000,
          },
        },
      ])
      .catch(error => {
        console.warn(
          "[appContext] settle-native-context flow failed (non-fatal):",
          error instanceof Error ? error.message : String(error),
        );
      });

    return {
      app: this.app,
      modularDrawer: this.modularDrawer,
      portfolio: this.portfolio,
      swap: this.swap,
    };
  }
}
