/// <reference types="react-scripts" />
//
interface Window {
  ledger: {
    e2e: {
      walletApi: {
        send: (params: string) => Promise<unknown>;
      };
    };
  };
  ReactNativeWebView?: {
    postMessage: (value: unknown) => void;
  };
}
