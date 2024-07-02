import { randomUUID } from "crypto";
import { web, by } from "detox";
import { e2eBridgeServer } from "../../bridge/server";
import { first, filter, map } from "rxjs/operators";
import { startDummyServer, createDummyServer, stopDummyServer } from "@ledgerhq/test-utils";
import { getElementById } from "../../helpers";
import { firstValueFrom } from "rxjs";

export default class LiveAppWebview {
  dummyServer: ReturnType<typeof createDummyServer>;
  serverStarted = false;

  constructor(liveAppDirectory: string) {
    this.dummyServer = createDummyServer(`${liveAppDirectory}/build`);
  }

  appTitle = () => getElementById("live-app-title");

  async startLiveApp(liveAppPort = 3000) {
    try {
      if (this.serverStarted) {
        await this.stopLiveApp();
      }

      const port = await startDummyServer(this.dummyServer, liveAppPort);

      const url = `http://localhost:${port}`;
      const response = await fetch(url);
      if (response.ok) {
        // eslint-disable-next-line no-console
        console.info(
          `========> Dummy Wallet API app successfully running on port ${port}! <=========`,
        );
        this.serverStarted = true;
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

  async stopLiveApp() {
    await stopDummyServer(this.dummyServer);
    this.serverStarted = false;
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

    const response = firstValueFrom(
      e2eBridgeServer.pipe(
        filter(
          (
            msg,
          ): msg is { type: "walletAPIResponse"; id: string; payload: Record<string, unknown> } =>
            msg.type === "walletAPIResponse",
        ),
        first(),
        map(msg => msg.payload),
      ),
    );

    return { id, response };
  }
}
