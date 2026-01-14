import React from "react";
import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import MarketCurrencySelect from "LLM/features/Market/screens/MarketCurrencySelect";
import MarketDetail from "LLM/features/Market/screens/MarketDetail";
import MarketList from "LLM/features/Market/screens/MarketList";
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
  return (
    <Stack.Group>
      <Stack.Screen
        name={ScreenName.MarketList}
        component={MarketList}
        options={{
          title: t("market.title"),
          headerShown: true,
          headerTitle: MarketListHeaderTitle,
          headerTransparent: true,
          headerLeft: MarketListHeaderLeft,
          headerRight: () => null,
        }}
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
