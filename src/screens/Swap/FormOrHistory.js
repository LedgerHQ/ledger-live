// @flow
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import type {
  Account,
  AccountLike,
} from "@ledgerhq/live-common/lib/types/account";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import Swap from "./Swap";
import History from "./History";
import styles from "../../navigation/styles";
import LText from "../../components/LText";

type RouteParams = {
  defaultAccount: ?AccountLike,
  defaultParentAccount: ?Account,
};

type TabLabelProps = {
  focused: boolean,
  color: string,
};

export default ({ route }: { route: { params: RouteParams } }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
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
          title: t("exchange.buy.tabTitle"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("transfer.swap.form.tab")}
            </LText>
          ),
        }}
      >
        {props => <Swap {...props} {...route?.params} />}
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
};

const Tab = createMaterialTopTabNavigator();
