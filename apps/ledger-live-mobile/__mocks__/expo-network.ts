export enum NetworkStateType {
  NONE = "NONE",
  UNKNOWN = "UNKNOWN",
  CELLULAR = "CELLULAR",
  WIFI = "WIFI",
  BLUETOOTH = "BLUETOOTH",
  ETHERNET = "ETHERNET",
  WIMAX = "WIMAX",
  VPN = "VPN",
  OTHER = "OTHER",
}

export const connectedNetworkState = {
  type: NetworkStateType.CELLULAR,
  isConnected: true,
  isInternetReachable: true,
};

export const useNetworkState = jest.fn(() => connectedNetworkState);
export const getNetworkStateAsync = jest.fn(() => Promise.resolve(connectedNetworkState));
export const addNetworkStateListener = jest.fn(() => ({ remove: jest.fn() }));
export const getIpAddressAsync = jest.fn(() => Promise.resolve("0.0.0.0"));
export const isAirplaneModeEnabledAsync = jest.fn(() => Promise.resolve(false));
