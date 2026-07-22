import type { PlatformOSType } from "react-native";

export function shouldAddAddContactKeyboardInset(
  platform: PlatformOSType,
  version: number | string,
): boolean {
  return platform === "ios" || (platform === "android" && Number(version) >= 35);
}
