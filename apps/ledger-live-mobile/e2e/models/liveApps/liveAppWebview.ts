import { randomUUID } from "crypto";
import { web, by } from "detox";
import { e2eBridgeServer } from "../../bridge/server";
import { first, filter, map } from "rxjs/operators";
import { startDummyServer } from "@ledgerhq/test-utils";
import { getElementById } from "../../helpers";

export default class LiveAppWebview {
  appTitle = () => getElementById("live-app-title");

  async startLiveApp(liveAppDirectory: string, liveAppPort = 3000) {
    try {
      const port = await startDummyServer(`${liveAppDirectory}/build`, liveAppPort);

      const url = `http://localhost:${port}`;
      const response = await fetch(url);
      if (response.ok) {
        // eslint-disable-next-line no-console
        console.info(
          `========> Dummy Wallet API app successfully running on port ${port}! <=========`,
        );
        return true;
      } else {
        throw new Error("Ping response != 200, got: " + response.status);
      }
    } catch (error) {
      console.warn(`========> Dummy test app not running! <=========`);
      console.error(error);
      return false;
    }
  }

  async send(params: Record<string, unknown>) {
    const webview = web.element(by.web.id("root"));
    const id = randomUUID();
    const json = JSON.stringify({
      id,
      jsonrpc: "2.0",
      ...params,
    });

    await webview.runScript(`function sendWalletAPIRequestFromLiveApp(webviewElement) {
      window.ledger.e2e.walletApi.send('${json}');
    }`);

    const response = e2eBridgeServer
      .pipe(
        filter(msg => msg.type === "walletAPIResponse"),
        first(),
        map(msg => msg.payload),
      )
      .toPromise();

    return { id, response };
  }
}
