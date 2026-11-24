import { byId } from "@e2e-mobile/components/ElementHandle";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

export type Webview = {
  /** Title matched by `driver.switchContext` (also used as the identity of the context). */
  title: string;
  /** Native element that hosts the webview; waited on before switching. */
  hostId?: string;
};

/* factory call for consistency when creating Webview objects */
export const webview = (config: Webview): Webview => config;

export async function switchToWebview(targetWebview: Webview) {
  const hostId = targetWebview.hostId ?? "wallet-api-webview";
  await byId(hostId).waitVisible();
  await driver.waitUntil(
    async () => {
      await driver.switchContext({
        title: RegExp(targetWebview.title, "i"),
        androidWebviewConnectionRetryTime: TIMEOUT.small,
        androidWebviewConnectTimeout: TIMEOUT.xlarge,
      });
      return true;
    },
    {
      interval: TIMEOUT.xsmall,
      timeout: TIMEOUT.xxlarge,
      timeoutMsg: `Expected to switch to webview ${targetWebview.title}`,
    },
  );
  driver.capabilities["custom:state"].switchedWebview = targetWebview;
}
