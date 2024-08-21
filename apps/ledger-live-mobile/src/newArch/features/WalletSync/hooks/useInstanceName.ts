import { getEnv } from "@ledgerhq/live-env";
import { Platform } from "react-native";

const platformMap: Record<string, string | undefined> = {
  ios: "iOS",
  android: "Android",
};

export function useInstanceName(): string {
  const hash = getEnv("USER_ID").slice(0, 5);
  return `${platformMap[Platform.OS] ?? Platform.OS} ${Platform.Version} ${hash ? " " + hash : ""}`;
}
