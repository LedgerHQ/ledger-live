import React, { useMemo } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";

import { Account, AccountLike } from "@ledgerhq/live-common/lib/types/account";

import { useTheme } from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";
import { ScreenName } from "../../const";
import Swap from "../../screens/Swap";
import History from "../../screens/Swap/History";
import { getLineTabNavigatorConfig } from "../../navigation/tabNavigatorConfig";

type TabLabelProps = {
  focused: boolean;
  color: string;
};

type RouteParams = {
  defaultAccount?: AccountLike;
  defaultParentAccount?: Account;
  providers: any;
  provider: string;
};

export default function SwapFormNavigator({
  route,
}: {
  route: { params: RouteParams };
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { params: routeParams } = route;

  const tabNavigationConfig = useMemo(() => getLineTabNavigatorConfig(colors), [
    colors,
  ]);

  return (
    <Tab.Navigator {...tabNavigationConfig}>
      <Tab.Screen
        name={ScreenName.SwapForm}
        options={{
          title: t("transfer.swap.form.tab"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("transfer.swap.form.tab")}
            </Text>
          ),
        }}
      >
        {_props => <Swap {..._props} {...routeParams} />}
      </Tab.Screen>
      <Tab.Screen
        name={ScreenName.SwapHistory}
        component={History}
        options={{
          title: t("exchange.buy.tabTitle"),
          tabBarLabel: (props: TabLabelProps) => (
            <Text variant="body" fontWeight="semiBold" {...props}>
              {t("transfer.swap.history.tab")}
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const Tab = createMaterialTopTabNavigator();
