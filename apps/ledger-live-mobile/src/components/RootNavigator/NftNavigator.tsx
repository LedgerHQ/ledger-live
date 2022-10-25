import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import NftViewer from "../Nft/NftViewer";
import NftImageViewer from "../Nft/NftImageViewer";
import { ScreenName } from "../../const";
import { BackButton } from "../../screens/OperationDetails";
import type { NftNavigatorParamList } from "./types/NftNavigator";

const NftNavigator = () => {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator screenOptions={stackNavConfig} detachInactiveScreens>
      <Stack.Screen
        name={ScreenName.NftViewer}
        component={NftViewer}
        options={({ navigation }) => ({
          title: undefined,
          headerRight: undefined,
          headerLeft: () => <BackButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name={ScreenName.NftImageViewer}
        component={NftImageViewer}
        options={({ navigation }) => ({
          title: undefined,
          headerRight: undefined,
          headerLeft: () => <BackButton navigation={navigation} />,
          headerTransparent: true,
        })}
      />
    </Stack.Navigator>
  );
};

const Stack = createStackNavigator<NftNavigatorParamList>();

export default NftNavigator;
