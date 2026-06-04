import React, { useMemo } from "react";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { ScreenName } from "~/const";
import MarketCurrencySelect from "LLM/features/Market/screens/MarketCurrencySelect";
import MarketDetail from "LLM/features/Market/screens//MarketDetail";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation";
import MarketList from "LLM/features/Market/screens/MarketList";
import MarketScreen from "LLM/features/Market/screens/MarketScreen";
import {
  MarketListHeaderLeft,
  MarketListHeaderTitle,
} from "LLM/features/Market/components/MarketListHeader";

export type MarketNavigatorStackParamList = {
  [ScreenName.MarketList]: { top100?: boolean };
  [ScreenName.MarketCurrencySelect]: undefined;
  [ScreenName.MarketDetail]: {
    currencyId: string;
    resetSearchOnUmount?: boolean;
  };
};

interface NavigatorProps {
  Stack: ReturnType<typeof createNativeStackNavigator<BaseNavigatorStackParamList>>;
}

export default function MarketNavigator({ Stack }: NavigatorProps) {
  const { t } = useTranslation();
  const { theme } = useLumenTheme();
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("mobile");
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
        component={shouldDisplayAssetDiscoverability ? MarketScreen : MarketList}
        options={
          shouldDisplayAssetDiscoverability
            ? marketScreenOptions
            : {
                title: t("market.title"),
                headerShown: true,
                headerTitle: MarketListHeaderTitle,
                headerTransparent: true,
                headerLeft: MarketListHeaderLeft,
                headerRight: () => null,
              }
        }
      />
      <Stack.Screen
        name={ScreenName.MarketCurrencySelect}
        component={MarketCurrencySelect}
        options={{
          title: t("market.filters.currency"),
          headerLeft: () => null,
          // FIXME: ONLY ON BOTTOM TABS AND DRAWER NAVIGATION
          // unmountOnBlur: true,
        }}
      />
      <Stack.Screen
        name={ScreenName.MarketDetail}
        component={MarketDetail}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Group>
  );
}
