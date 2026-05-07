import { DdRum } from "@datadog/mobile-react-native";
import { logStartupEvent } from "./logStartupTime";

export function ddAddViewLoadingTime() {
  logStartupEvent("DD view loaded");
  DdRum.addViewLoadingTime(true);
}
