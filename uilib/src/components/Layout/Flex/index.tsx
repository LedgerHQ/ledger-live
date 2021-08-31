import React from "react";
import styled from "styled-components/native";
import { SpacingProps } from "@components/Layout/types";
import { background, flexbox, space } from "styled-system";

// Nb Expose style props as you need them instead of allowing for all to be passed directly.
// ref: https://styled-system.com/table
interface FlexBoxProps extends SpacingProps {
  alignItems?: "flex-start" | "flex-end" | "center" | "baseline" | "stretch";
  flexBasis?: string;
  flexDirection?: "row" | "row-reverse" | "column" | "column-reverse";
  flexGrow?: string | number;
  flexShrink?: string | number;
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "baseline"
    | "stretch";
  children?: React.ReactNode;
  style?: Record<string, unknown>;
}

const FlexBox = styled.View<FlexBoxProps>`
  display: flex;
  ${flexbox};
  ${space};
  ${background};
`;

export default FlexBox;
