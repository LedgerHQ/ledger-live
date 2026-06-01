/* eslint-disable no-var */
declare global {
  var speculosDevices: Map<string, number>;
  var speculosStartupErrorMessage: string | undefined;
  var speculosFailureStderr: string | undefined;
  var webSocket: {
    wss: Server | undefined;
    ws: WebSocket | undefined;
    messages: { [id: string]: MessageData };
    e2eBridgeServer: Subject<ServerData>;
  };

  var pendingCallbacks: Map<string, { callback: (data: string) => void }>;

  namespace WebdriverIO {
    interface Capabilities {
      /** Set by Appium UiAutomator2 in returned session caps */
      deviceUDID?: string;
    }
  }
}

export {};
