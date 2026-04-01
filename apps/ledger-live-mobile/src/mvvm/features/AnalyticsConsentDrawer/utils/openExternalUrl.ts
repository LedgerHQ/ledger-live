import { Linking } from "react-native";

export function openExternalUrl(url: string): void {
  void Linking.openURL(url).catch(() => {});
}
