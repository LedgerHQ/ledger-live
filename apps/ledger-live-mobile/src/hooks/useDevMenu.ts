import { useEffect } from "react";
import { DevSettings } from "react-native";
import { useDispatch } from "~/context/hooks";
import { store } from "~/state-manager/configureStore";
import { setTheme } from "~/actions/settings";
import { resolvedThemeSelector } from "~/reducers/settings";
import { NavigatorName, ScreenName } from "~/const";
import { navigate } from "~/rootnavigation";
import { ConsoleLogger } from "~/logger";

// Module-level guard: prevents duplicate registrations when `HookDevTools`
// remounts (e.g. when `RebootProvider`'s key changes).
let registered = false;

/**
 * Registers custom entries in the React Native developer menu (shake / Cmd-D / Cmd-M).
 *
 * Dev-only: nothing is registered in release builds (`__DEV__` is `false`).
 */
export const useDevMenu = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!__DEV__) return;
    if (registered) return;
    registered = true;

    DevSettings.addMenuItem("@ledgerhq/logs verbosity: all", () => {
      ConsoleLogger.getLogger().setVerbosity("all");
    });
    DevSettings.addMenuItem("@ledgerhq/logs verbosity: env", () => {
      ConsoleLogger.getLogger().setVerbosity("env");
    });
    DevSettings.addMenuItem("Go to Settings", () => {
      navigate(NavigatorName.Settings, { screen: ScreenName.SettingsScreen });
    });
    DevSettings.addMenuItem("Go to Debug Settings", () => {
      navigate(NavigatorName.Settings, { screen: ScreenName.DebugSettings });
    });
    DevSettings.addMenuItem("Toggle app theme (light/dark)", () => {
      const resolved = resolvedThemeSelector(store.getState());
      dispatch(setTheme(resolved === "dark" ? "light" : "dark"));
    });
  }, [dispatch]);
};
