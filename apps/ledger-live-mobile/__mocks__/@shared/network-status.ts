export const connectedNetworkState = { isConnected: true, isInternetReachable: true };

export const useNetworkState = jest.fn(() => connectedNetworkState);
export const getNetworkState = jest.fn(() => Promise.resolve(connectedNetworkState));
export const subscribeToNetworkState = jest.fn(() => jest.fn());
