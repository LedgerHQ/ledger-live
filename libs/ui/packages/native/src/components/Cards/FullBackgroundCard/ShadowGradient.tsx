import React from "react";
import Svg, { LinearGradient, Defs, Stop, Rect } from "react-native-svg";
import styled from "styled-components/native";

const StyledSVG = styled(Svg)`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
`;

export type Props = React.ComponentProps<typeof Svg> & {
  color: string;
};

export default function Gradient({ color }: Props): JSX.Element {
  return (
    <StyledSVG>
      <Defs>
        <LinearGradient
          id="myGradient"
          x1="0%"
          y1="100%"
          x2="100%"
          y2="0%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop key="0%" offset="0%" stopOpacity={0.8} stopColor={color} />
          <Stop key="100%" offset="100%" stopOpacity={0.25} stopColor={color} />
        </LinearGradient>
      </Defs>
      <Rect rx={8} x="0" y="0" width="100%" height="100%" opacity={1} fill="url(#myGradient)" />
    </StyledSVG>
  );
}
