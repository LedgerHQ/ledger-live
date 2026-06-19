/**
 * In-app registry mapping a logical webview name (e.g. "wallet-api-webview")
 * to a callable that injects JavaScript into that webview.
 *
 * Used by the e2e bridge to drive WebView-hosted live apps from the test runner:
 * the test sends a `webviewDriver` message, the bridge client looks up the
 * registered injector, runs the JS, and the WebView posts back the result via
 * the magic `__E2E_WEBVIEW_DRIVER_RESULT__` message type which is then routed
 * back over the bridge as a `webviewDriverResult` message.
 */

export const E2E_WEBVIEW_DRIVER_RESULT_TYPE = "__E2E_WEBVIEW_DRIVER_RESULT__";

export type WebviewInjector = (js: string) => void;

const injectors = new Map<string, WebviewInjector>();

export const webviewDriverStore = {
  register(name: string, injector: WebviewInjector): () => void {
    injectors.set(name, injector);
    return () => {
      const current = injectors.get(name);
      if (current === injector) injectors.delete(name);
    };
  },

  getInjector(name: string): WebviewInjector | undefined {
    return injectors.get(name);
  },

  clear() {
    injectors.clear();
  },
};
