type NetworkState = {
  enableNetworkLogs: boolean;
  debugHttpResponse: boolean;
  ledgerClientVersion: string;
  getCallsTimeout: number;
  getCallsRetry: number;
};

declare global {
  interface GlobalThis {
    __ledgerLiveNetworkState?: NetworkState;
  }
}

const defaults: NetworkState = {
  enableNetworkLogs: false,
  debugHttpResponse: false,
  ledgerClientVersion: "",
  getCallsTimeout: 60 * 1000,
  getCallsRetry: 2,
};

export function getNetworkState(): Readonly<NetworkState> {
  globalThis.__ledgerLiveNetworkState ??= { ...defaults };
  return globalThis.__ledgerLiveNetworkState;
}

export type { NetworkState };
