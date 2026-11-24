import { Webview } from "@e2e-mobile/components/SwitchToWebview";

declare global {
  namespace WebdriverIO {
    interface Capabilities {
      /** Set by Appium UiAutomator2 in returned session caps */
      deviceUDID?: string;
      "custom:capa": {
        websocketPort: number;
        wsToken: string;
      };
      "custom:state": {
        switchedWebview: Webview | undefined;
      };
    }
    interface Browser {
      getAppIdentifier: () => Promise<string>;
    }
  }
}

export {};
