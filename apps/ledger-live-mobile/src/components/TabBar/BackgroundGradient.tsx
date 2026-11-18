import React from "react";
import styled from "styled-components/native";
import Svg, { Defs, LinearGradient, Rect } from "react-native-svg";

const StyledSVG = styled(Svg)`
  position: absolute;
  bottom: 0;
  width: 100%;
`;

type HorizontalProps = {
  height?: number;
  opacity: number;
  stops: React.JSX.Element[];
};

export const BackgroundGradientHorizontal = ({ height, opacity, stops }: HorizontalProps) => (
  <StyledSVG
    pointerEvents="none"
    style={{
      height: height ?? "100%",
    }}
  >
    <Defs>
      <LinearGradient
        id="myGradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
        gradientUnits="userSpaceOnUse"
      >
        {stops}
      </LinearGradient>
    </Defs>
    <Rect
      transform={[{ translateX: 0 }, { translateY: 0 }]}
      width="100%"
      height="100%"
      opacity={opacity}
      fill="url(#myGradient)"
    />
  </StyledSVG>
);
