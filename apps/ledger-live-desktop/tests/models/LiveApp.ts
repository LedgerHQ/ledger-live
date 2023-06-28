import { APIRequestContext, Page } from "@playwright/test";
import { randomUUID } from "crypto";
import { WebviewTag } from "../../src/renderer/components/Web3AppWebview/types";
import * as server from "../utils/serve-dummy-app";

export class LiveApp {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  static async start(request: APIRequestContext): Promise<boolean> {
    try {
      const port = await server.start("dummy-wallet-app/build");
      const url = `http://localhost:${port}`;
      const response = await request.get(url);
      if (response.ok()) {
        console.info(
          `========> Dummy Wallet API app successfully running on port ${port}! <=========`,
        );
        process.env.MOCK_REMOTE_LIVE_MANIFEST = JSON.stringify(
          server.getMockAppManifest({
            id: "dummy-live-app",
            url,
            name: "Dummy Wallet API Live App",
            apiVersion: "2.0.0",
            content: {
              shortDescription: {
                en: "App to test the Wallet API",
              },
              description: {
                en: "App to test the Wallet API with Playwright",
              },
            },
          }),
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

  static async stop() {
    server.stop();
    console.info(`========> Dummy Wallet API app stopped <=========`);
    delete process.env.MOCK_REMOTE_LIVE_MANIFEST;
  }

  send(request: Record<string, unknown>) {
    const id = randomUUID();
    const sendFunction = `
      (function() {
        return window.ledger.e2e.walletApi.send('${JSON.stringify({
          id,
          jsonrpc: "2.0",
          ...request,
        })}');
      })()
    `;

    return {
      id,
      response: this.page.evaluate(functionToExecute => {
        const webview = document.querySelector("webview") as WebviewTag;
        return webview.executeJavaScript(functionToExecute);
      }, sendFunction),
    };
  }
}
