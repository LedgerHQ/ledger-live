export type NetworkState = {
  isConnected?: boolean;
  isInternetReachable?: boolean;
};

export type NetworkStateListener = (state: NetworkState) => void;
