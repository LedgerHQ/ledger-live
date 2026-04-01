import { log } from "@ledgerhq/logs";
import { Linking } from "react-native";

export async function openExternalUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch (error) {
    log("analytics-consent-drawer", "Failed to open external URL", { error, url });
  }
}
