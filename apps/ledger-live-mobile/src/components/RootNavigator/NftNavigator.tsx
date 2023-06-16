import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import NftViewer from "../Nft/NftViewer";
import NftImageViewer from "../Nft/NftImageViewer";
import { ScreenName } from "../../const";
import type { NftNavigatorParamList } from "./types/NftNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

const NftNavigator = () => {
  const { colors, dark } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const GradientHeader = () => (
    <>
      <Svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <Defs>
          <LinearGradient
            id="myGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop key="0%" offset="0%" stopOpacity={0} stopColor="rgba(19, 18, 20, 0)" />
            <Stop
              key="50%"
              offset="50%"
              stopOpacity={0.5}
              stopColor={!dark ? "#131214" : "white"}
            />
            <Stop key="100%" offset="100%" stopOpacity={1} stopColor="#131214" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>

      <NavigationHeaderBackButton />
    </>
  );

  return (
    <Stack.Navigator screenOptions={stackNavConfig} detachInactiveScreens>
      <Stack.Screen
        name={ScreenName.NftViewer}
        component={NftViewer}
        options={() => ({
          title: "",
          headerRight: undefined,
          headerStyle: {
            backgroundColor: "pink", //to be changed, blur won't work in here cos native app gradient
          },
          // header: () => <GradientHeader />, ///this is the gradient header
          headerTransparent: false,
          headerLeft: () => <GradientHeader />,
        })}
      />
      <Stack.Screen
        name={ScreenName.NftImageViewer}
        component={NftImageViewer}
        options={() => ({
          title: "",
          headerRight: undefined,
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTransparent: true,
        })}
      />
    </Stack.Navigator>
  );
};

const Stack = createStackNavigator<NftNavigatorParamList>();

export default NftNavigator;
