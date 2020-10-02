// @flow
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTranslation } from "react-i18next";
import type {
  Account,
  AccountLike,
} from "@ledgerhq/live-common/lib/types/account";
import { ScreenName } from "../../const";
import Swap from "./Swap";
import History from "./History";
import styles from "../../navigation/styles";

type RouteParams = {
  defaultAccount: ?AccountLike,
  defaultParentAccount: ?Account,
};

export default ({ route }: { route: { params: RouteParams } }) => {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      tabBarOptions={{
        headerStyle: styles.headerNoShadow,
      }}
    >
      <Tab.Screen
        name={ScreenName.SwapForm}
        options={{ title: t("transfer.swap.form.tab") }}
      >
        {props => <Swap {...props} {...route?.params} />}
      </Tab.Screen>
      <Tab.Screen
        name={ScreenName.SwapHistory}
        component={History}
        options={{ title: t("transfer.swap.history.tab") }}
      />
    </Tab.Navigator>
  );
};

const Tab = createMaterialTopTabNavigator();
