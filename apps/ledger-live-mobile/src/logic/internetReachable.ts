import NetInfo from "@react-native-community/netinfo";

export const internetReachable = async () => {
  // workaround : on iOS, netInfo returns null on the first call, see ; https://github.com/react-native-netinfo/react-native-netinfo/issues/572
const isInternetReachable = (await NetInfo.fetch()).isInternetReachable;
if (isInternetReachable !== null) return isInternetReachable
return (await NetfInfo.fetch()).isInternetReachable
};
