import { getNetworkStateAsync } from "expo-network";

export const internetReachable = async () =>
  (await getNetworkStateAsync()).isInternetReachable === true;
