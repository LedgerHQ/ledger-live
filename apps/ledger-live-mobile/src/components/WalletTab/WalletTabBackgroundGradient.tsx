import React, { memo, useContext } from "react";
import { Animated, ColorValue } from "react-native";
import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
} from "react-native-svg";
import { useTheme } from "styled-components/native";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

import multiply = Animated.multiply;

type Props = {
  scrollX: MaterialTopTabBarProps["position"];
  color?: ColorValue;
};

function WalletTabBackgroundGradient({ color, scrollX }: Props) {
  const { colors } = useTheme();

  const { scrollY, headerHeight } = useContext(WalletTabNavigatorScrollContext);

  const opacity = multiply(
    scrollY.interpolate({
      inputRange: [0, headerHeight],
      outputRange: [1, 0],
      extrapolate: "clamp",
    }),
    scrollX.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
      extrapolate: "clamp",
    }),
  );

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.background.main,
          position: "absolute",
          width: 541,
          height: 450,
          top: -130,
          opacity,
        },
      ]}
    >
      <Svg width={541} height={454} viewBox="0 0 541 454" fill="none">
        <Path fill="url(#paint0_linear_9_2)" d="M0 0H541V454H0z" />
        <Path fill="url(#paint1_radial_9_2)" d="M0 0H541V454H0z" />
        <Path fill="url(#paint2_radial_9_2)" d="M0 0H541V454H0z" />
        <Path fill="url(#paint3_linear_9_2)" d="M0 0H541V454H0z" />
        <Defs>
          <LinearGradient
            id="paint0_linear_9_2"
            x1={270.5}
            y1={0}
            x2={270.5}
            y2={454}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0.380208} stopColor={color || "#BE96FF"} />
            <Stop offset={0.864583} stopColor={color || "#BE97FF"} />
          </LinearGradient>
          <RadialGradient
            id="paint1_radial_9_2"
            cx={0}
            cy={0}
            r={1}
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(131.49984 186.99987 -218.94593 153.96457 172 252.5)"
          >
            <Stop stopColor={color || "#B7A6F5"} />
            <Stop
              offset={0.505208}
              stopColor={color || "#B09BF1"}
              stopOpacity={0.770833}
            />
            <Stop offset={1} stopColor={color || "#9678E3"} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="paint2_radial_9_2"
            cx={0}
            cy={0}
            r={1}
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(-138.50157 186.49933 -184.81339 -137.24953 361.5 250)"
          >
            <Stop stopColor={color || "#8069D5"} />
            <Stop offset={0.576908} stopColor={color || "#AC91F8"} />
            <Stop
              offset={0.973958}
              stopColor={color || "#BE9BFD"}
              stopOpacity={0}
            />
          </RadialGradient>
          <LinearGradient
            id="paint3_linear_9_2"
            x1={270.5}
            y1={-73.5}
            x2={270.5}
            y2={454}
            gradientUnits="userSpaceOnUse"
          >
            <Stop
              offset={0.46223}
              stopColor={colors.background.main}
              stopOpacity={0.6}
            />
            <Stop offset={0.977251} stopColor={colors.background.main} />
          </LinearGradient>
        </Defs>
      </Svg>
    </Animated.View>
  );
}

export default memo<Props>(WalletTabBackgroundGradient);
