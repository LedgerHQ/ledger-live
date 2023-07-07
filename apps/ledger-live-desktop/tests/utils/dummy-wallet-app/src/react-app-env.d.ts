/// <reference types="react-scripts" />
//
interface Window {
  ledger: {
    e2e: {
      walletApi: {
        send: (params: any) => void;
      };
    };
  };
}
