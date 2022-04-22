import * as React from "react";
import Svg, { Path } from "react-native-svg";
import { system } from "styled-system";
import styled from "styled-components/native";

const fillSystem = system({
  fill: {
    property: "fill",
    scale: "colors",
  },
});

export const StyledSvg = styled(Svg).attrs(props => ({
  ...fillSystem(props),
}))``;
export const StyledPath = styled(Path).attrs(props => ({
  ...fillSystem(props),
}))``;
