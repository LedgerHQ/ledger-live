// @flow

import React, { useMemo } from "react";
import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import NftViewer from "../Nft/NftViewer";
import { ScreenName } from "../../const";

const NftNavigator = () => {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors, true), [
    colors,
  ]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.NftViewer}
        component={NftViewer}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const Stack = createStackNavigator();

export default NftNavigator;
