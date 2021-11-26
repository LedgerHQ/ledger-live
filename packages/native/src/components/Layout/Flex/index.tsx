import React from "react";
import styled from "styled-components/native";
import {
  background,
  BackgroundProps,
  color,
  ColorProps,
  flexbox,
  FlexboxProps,
  layout,
  LayoutProps,
  space,
  SpaceProps,
  border,
} from "styled-system";

// Nb Expose style props as you need them instead of allowing for all to be passed directly.
// ref: https://styled-system.com/table
export interface Props
  extends ColorProps,
    BackgroundProps,
    LayoutProps,
    FlexboxProps,
    SpaceProps {
  alignItems?: "flex-start" | "flex-end" | "center" | "baseline" | "stretch";
  flexBasis?: string;
  flexDirection?: "row" | "row-reverse" | "column" | "column-reverse";
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  children?: React.ReactNode;
  style?: Record<string, unknown>;
}

const FlexBox = styled.View<Props>`
  display: flex;
  ${flexbox};
  ${space};
  ${background};
  ${color};
  ${layout};
  ${border};
`;

export default FlexBox;
