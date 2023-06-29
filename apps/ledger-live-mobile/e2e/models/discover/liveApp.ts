import { randomUUID } from "crypto";
import { web, by } from "detox";

export class LiveApp {
  // constructor() {}

  async send(params: Record<string, unknown>) {
    const webview = web.element(by.web.id("root"));
    const id = randomUUID();
    const json = JSON.stringify({
      id,
      jsonrpc: "2.0",
      ...params,
    });

    webview.runScript(`function foo(element) {
      console.log(window.ledger.e2e.walletApi.send);
      window.ledger.e2e.walletApi.send('${json}');
    }`);
  }
}
