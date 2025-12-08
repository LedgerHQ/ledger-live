import { getDeviceNameSync } from "react-native-device-info";
import { getEnv } from "@ledgerhq/live-env";
import { Platform } from "react-native";

const platformMap: Record<string, string | undefined> = {
  ios: "iPhone iOS",
  android: "Android",
};

let deviceName: string;

export function useInstanceName(): string {
  // FIXME migrate to userIdSelector + exportUserIdForDisplay() (equipment_id for UI display, need to add this method)
  const hash = getEnv("USER_ID").slice(0, 5);
  const os = platformMap[Platform.OS] ?? Platform.OS;
  if (!deviceName) deviceName = getDeviceNameSync() ?? `${os} ${Platform.Version}`;
  return `${deviceName} ${hash ? " " + hash : ""}`;
}
