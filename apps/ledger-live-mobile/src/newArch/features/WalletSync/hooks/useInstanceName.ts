import { getDeviceNameSync } from "react-native-device-info";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { userIdSelector } from "~/reducers/identities";

const platformMap: Record<string, string | undefined> = {
  ios: "iPhone iOS",
  android: "Android",
};

let deviceName: string;

export function useInstanceName(): string {
  const userId = useSelector(userIdSelector);
  const hash = userId.exportUserIdForDisplay().slice(0, 5);
  const os = platformMap[Platform.OS] ?? Platform.OS;
  if (!deviceName) deviceName = getDeviceNameSync() ?? `${os} ${Platform.Version}`;
  return `${deviceName} ${hash ? " " + hash : ""}`;
}
