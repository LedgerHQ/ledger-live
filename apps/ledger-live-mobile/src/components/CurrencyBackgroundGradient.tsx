import * as React from "react";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Mask,
  G,
} from "react-native-svg";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useTheme } from "styled-components/native";

function BackgroundGradient({
  currentPositionY,
  graphCardEndPosition,
  gradientColor,
}: {
  currentPositionY: SharedValue<number>;
  graphCardEndPosition: number;
  gradientColor: string;
}) {
  const BackgroundOverlayOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition + 10, graphCardEndPosition + 90],
      [1, 0],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
    };
  }, [graphCardEndPosition]);

  const { colors } = useTheme();

  return (
    <Animated.View
      height={"100%"}
      justifyContent={"center"}
      style={[
        BackgroundOverlayOpacity,
        {
          background: colors.background.main,
          position: "absolute",
          width: 541,
          height: 450,
          top: 0,
        },
      ]}
    >
      <Svg
        width={541}
        height={454}
        viewBox="0 0 541 454"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Mask
          id="a"
          style={{
            maskType: "alpha",
          }}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={541}
          height={454}
        >
          <Path fill="#fff" d="M0 0H541V454H0z" />
        </Mask>
        <G mask="url(#a)">
          <Path fill="#272727" d="M0 0H541V454H0z" />
          <Path
            fill="url(#paint0_linear_22_3)"
            fillOpacity={0.3}
            d="M0 0H541V450.077H0z"
          />
          <Path fill="url(#paint1_linear_22_3)" d="M0 0H541V450.077H0z" />
        </G>
        <Defs>
          <LinearGradient
            id="paint0_linear_22_3"
            x1={270.5}
            y1={0}
            x2={270.5}
            y2={450.077}
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor={gradientColor} />
            <Stop offset={1} stopColor={gradientColor} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient
            id="paint1_linear_22_3"
            x1={270.5}
            y1={0}
            x2={270.5}
            y2={450.077}
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor="#131214" stopOpacity={0} />
            <Stop offset={1} stopColor="#131214" />
          </LinearGradient>
        </Defs>
      </Svg>
    </Animated.View>
  );
}

export default BackgroundGradient;
