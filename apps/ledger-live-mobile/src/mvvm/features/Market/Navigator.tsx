import React, { useMemo } from "react";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation";
import MarketScreen from "LLM/features/Market/screens/MarketScreen";
import type { MarketListRouteParams } from "LLM/features/Market/types";

export type MarketNavigatorStackParamList = {
  [ScreenName.MarketList]: MarketListRouteParams | undefined;
};

interface NavigatorProps<NavId extends string | undefined = string | undefined> {
  // Generic over the navigator id so any Base stack works regardless of whether it sets an id
  // (e.g. the production stack now carries BASE_NAVIGATOR_ID, test stacks do not).
  Stack: ReturnType<typeof createNativeStackNavigator<BaseNavigatorStackParamList, NavId>>;
}

export default function MarketNavigator<NavId extends string | undefined = string | undefined>({
  Stack,
}: Readonly<NavigatorProps<NavId>>) {
  const { t } = useTranslation();
  const { theme } = useLumenTheme();
  const marketScreenOptions = useMemo(
    () => ({
      ...getStackNavigationConfigV4(theme),
      title: t("market.title"),
      headerLeft: undefined,
      headerRight: () => null,
    }),
    [theme, t],
  );
  return (
    <Stack.Group>
      <Stack.Screen
        name={ScreenName.MarketList}
        component={MarketScreen}
        options={marketScreenOptions}
      />
    </Stack.Group>
  );
}
