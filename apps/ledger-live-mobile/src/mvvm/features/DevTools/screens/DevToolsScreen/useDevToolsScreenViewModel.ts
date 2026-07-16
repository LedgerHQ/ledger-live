import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation";
import { useFeatureFlagsToolProps } from "@devtools/bindings";
import type { DevToolsConfig } from "@devtools/shell";

export function useDevToolsScreenViewModel(): {
  config: DevToolsConfig;
  screenOptions: NativeStackNavigationOptions;
} {
  const featureFlagsProps = useFeatureFlagsToolProps();
  const { theme } = useTheme();
  const { bottom } = useSafeAreaInsets();

  const config: DevToolsConfig = useMemo(
    () => [{ id: "feature-flags", config: featureFlagsProps }],
    [featureFlagsProps],
  );

  // DevTools renders its own stack; reuse the app's config and add the bottom
  // safe-area inset since DevTools only provides body content.
  const screenOptions: NativeStackNavigationOptions = useMemo(() => {
    const navConfig = getStackNavigationConfigV4(theme);
    return {
      ...navConfig,
      contentStyle: [navConfig.contentStyle, { paddingBottom: bottom }],
    };
  }, [theme, bottom]);

  return { config, screenOptions };
}
