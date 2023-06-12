import React from "react";
import styled from "styled-components/native";
import Svg, { Defs, LinearGradient, Rect } from "react-native-svg";

const StyledSVG = styled(Svg)`
  position: absolute;
  bottom: 0;
  width: 100%;
`;

type Props = {
  height: number;
  opacity: number;
  stops: JSX.Element[];
};

const BackgroundGradient = ({ height, opacity, stops }: Props) => (
  <StyledSVG style={{ height }}>
    <Defs>
      <LinearGradient
        id="myGradient"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
        gradientUnits="userSpaceOnUse"
      >
        {stops}
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" opacity={opacity} fill="url(#myGradient)" />
  </StyledSVG>
);

export default BackgroundGradient;
