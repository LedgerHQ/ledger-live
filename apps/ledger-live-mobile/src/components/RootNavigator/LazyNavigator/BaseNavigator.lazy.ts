import { NavigatorName } from "~/const";
import { registerAppScreen } from "LLM/performance/apis";

export const SettingsNavigator = registerAppScreen<
  typeof import("~/components/RootNavigator/SettingsNavigator").default
>({
  loader: () => import("~/components/RootNavigator/SettingsNavigator"),
  name: NavigatorName.Settings,
});
