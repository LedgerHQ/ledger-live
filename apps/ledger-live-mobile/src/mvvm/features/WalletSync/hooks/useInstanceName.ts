import { getDeviceNameSync } from "react-native-device-info";
import { Platform } from "react-native";
import { useSelector } from "~/context/hooks";
import { userIdSelector } from "@ledgerhq/client-ids/store";

const platformMap: Record<string, string | undefined> = {
  ios: "iPhone iOS",
  android: "Android",
};

let deviceName: string;

export function useInstanceName(): string {
  const userId = useSelector(userIdSelector);
  const os = platformMap[Platform.OS] ?? Platform.OS;
  if (!deviceName) deviceName = getDeviceNameSync() ?? `${os} ${Platform.Version}`;
  const hash = userId.exportUserIdForWalletSyncInstanceName().slice(0, 5);
  return `${deviceName}${hash ? ` ${hash}` : ""}`;
}
