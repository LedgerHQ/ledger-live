import { getDeviceNameSync } from "react-native-device-info";
import { getEnv } from "@ledgerhq/live-env";
import { Platform } from "react-native";

const platformMap: Record<string, string | undefined> = {
  ios: "iPhone iOS",
  android: "Android",
};

export function useInstanceName(): string {
  const hash = getEnv("USER_ID").slice(0, 5);
  const os = platformMap[Platform.OS] ?? Platform.OS;
  const deviceName = getDeviceNameSync() ?? `${os} ${Platform.Version}`;
  return `${deviceName} ${hash ? " " + hash : ""}`;
}
