import { Platform } from "react-native";

export function getWalletPlatform() {
  return Platform.OS === "ios"
    ? { brand: "Apple" as const, icon: "Apple" as const, i18nKey: "ios" as const }
    : { brand: "Google" as const, icon: "Android" as const, i18nKey: "android" as const };
}
