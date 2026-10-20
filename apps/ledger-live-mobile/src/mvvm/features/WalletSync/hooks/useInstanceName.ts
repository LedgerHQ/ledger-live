import { deviceName as nativeDeviceName } from "expo-device";
import { getEnv } from "@shared/env";
import { Platform } from "react-native";

const platformMap: Record<string, string | undefined> = {
  ios: "iPhone iOS",
  android: "Android",
};

let deviceName: string;

export function useInstanceName(): string {
  const hash = getEnv("USER_ID").slice(0, 5);
  const os = platformMap[Platform.OS] ?? Platform.OS;
  if (!deviceName) deviceName = nativeDeviceName ?? `${os} ${Platform.Version}`;
  return `${deviceName} ${hash ? " " + hash : ""}`;
}
