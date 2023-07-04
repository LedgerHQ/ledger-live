import { randomUUID } from "crypto";
import { web, by } from "detox";
import { e2eBridgeServer } from "../../bridge/server";
import { first, filter, map } from "rxjs/operators";

export default class LiveAppWebview {
  async send(params: Record<string, unknown>) {
    const webview = web.element(by.web.id("root"));
    const id = randomUUID();
    const json = JSON.stringify({
      id,
      jsonrpc: "2.0",
      ...params,
    });

    await webview.runScript(`function foo(element) {
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
