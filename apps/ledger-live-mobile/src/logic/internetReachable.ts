import NetInfo from "@react-native-community/netinfo";

export const internetReachable = async () => {
  // workaround : on iOS, netInfo returns null on the first call, see ; https://github.com/react-native-netinfo/react-native-netinfo/issues/572
  const timeout = (milliseconds: number) =>
    new Promise(resolve => setTimeout(resolve, milliseconds));

  let isInternetReachable: boolean | null = false;

  isInternetReachable = (await NetInfo.fetch()).isInternetReachable;

  if (isInternetReachable !== null) return isInternetReachable;

  await timeout(200);

  isInternetReachable = (await NetInfo.fetch()).isInternetReachable;
  return isInternetReachable;
};
