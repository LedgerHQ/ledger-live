import { getNetworkState } from "@shared/network-status";

export const internetReachable = async () => (await getNetworkState()).isInternetReachable === true;
