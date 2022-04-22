// @flow

import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

import type {
  Account,
  AccountLike,
} from "@ledgerhq/live-common/lib/types/account";

import { ScreenName } from "../../const";
import Swap from "../../screens/Swap";
import styles from "../../navigation/styles";
import LText from "../LText";
import History from "../../screens/Swap/History";

type TabLabelProps = {
  focused: boolean,
  color: string,
};

type RouteParams = {
  defaultAccount: ?AccountLike,
  defaultParentAccount: ?Account,
  providers: any,
  provider: string,
};

export default function SwapFormNavigator({
  route,
}: {
  route: { params: RouteParams },
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { params: routeParams } = route;

  return (
    <Tab.Navigator
      tabBarOptions={{
        headerStyle: styles.headerNoShadow,
        indicatorStyle: {
          backgroundColor: colors.live,
        },
      }}
    >
      <Tab.Screen
        name={ScreenName.SwapForm}
        options={{
          title: t("transfer.swap.form.tab"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            /** width has to be a little bigger to accomodate the switch in size between semibold to regular */
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("transfer.swap.form.tab")}
            </LText>
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
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("transfer.swap.history.tab")}
            </LText>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const Tab = createMaterialTopTabNavigator();
