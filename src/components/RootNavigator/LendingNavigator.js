// @flow
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import styles from "../../navigation/styles";
import LendingDashboard from "../../screens/Lending/Dashboard";
import LendingClosedLoans from "../../screens/Lending/ClosedLoans";
import LendingHistory from "../../screens/Lending/History";
import LText from "../LText";

type TabLabelProps = {
  focused: boolean,
  color: string,
};

const Tab = createMaterialTopTabNavigator();

export default function LendingNavigator() {
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
        name={ScreenName.LendingDashboard}
        component={LendingDashboard}
        options={{
          title: t("transfer.lending.dashboard.tabTitle"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            // width has to be a little bigger to accomodate the switch in size between semibold to regular
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("transfer.lending.dashboard.tabTitle")}
            </LText>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenName.LendingClosedLoans}
        component={LendingClosedLoans}
        options={{
          title: t("transfer.lending.closedLoans.tabTitle"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            //  width has to be a little bigger to accomodate the switch in size between semibold to regular
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("transfer.lending.closedLoans.tabTitle")}
            </LText>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenName.LendingHistory}
        component={LendingHistory}
        options={{
          title: t("transfer.lending.history.tabTitle"),
          tabBarLabel: ({ focused, color }: TabLabelProps) => (
            // width has to be a little bigger to accomodate the switch in size between semibold to regular
            <LText style={{ width: "110%", color }} semiBold={focused}>
              {t("transfer.lending.history.tabTitle")}
            </LText>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
