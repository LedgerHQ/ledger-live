/// <reference types="react-scripts" />
//
interface Window {
  ledger: {
    e2e: {
      walletApi: {
        send: (params: unknown) => void;
      };
    };
  };
  ReactNativeWebView?: {
    postMessage: (value: unknown) => void;
  };
}
