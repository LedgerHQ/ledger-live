import { randomUUID } from "crypto";
import { e2eBridgeServer } from "../bridge/server";
import { first, filter, map } from "rxjs/operators";
import { startDummyServer, stopDummyServer as stopDummyServer } from "@ledgerhq/test-utils";
import { firstValueFrom } from "rxjs";

export async function startLiveApp(liveAppDirectory: string, liveAppPort = 3000) {
  try {
    const port = await startDummyServer(`${liveAppDirectory}/dist`, liveAppPort);

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

export async function stopServer() {
  await stopDummyServer();
}

export async function send(params: Record<string, unknown>) {
  const webview = getWebElementById("root");
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
        (msg): msg is { type: "walletAPIResponse"; id: string; payload: Record<string, unknown> } =>
          msg.type === "walletAPIResponse",
      ),
      first(),
      map(msg => msg.payload),
    ),
  );

  return { id, response };
}
