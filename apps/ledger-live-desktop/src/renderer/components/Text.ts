import React from "react";
import styled from "styled-components";
import {
  fontSize,
  fontWeight,
  textAlign,
  color,
  space,
  lineHeight,
  letterSpacing,
  system,
  FontWeightProps,
  LineHeightProps,
  FontSizeProps,
  ColorProps,
  SpaceProps,
  TextAlignProps,
  LetterSpacingProps,
} from "styled-system";
import fontFamily from "~/renderer/styles/styled/fontFamily";

const uppercase = system({
  uppercase: {
    property: "textTransform",
    transform: value => (value ? "uppercase" : "none"),
  },
});

const textTransform = system({
  textTransform: true,
});

export type TextProps = {
  style?: Object;
  ff?: string;
  fontSize?: number | string;
  textAlign?: string;
  color?: string;
  fontWeight?: string;
  mt?: number | string;
  mb?: number | string;
  lineHeight?: string;
};

const Text: React.ComponentType<TextProps> = styled.span`
  ${uppercase};
  ${lineHeight};
  ${fontFamily};
  ${fontSize};
  ${textAlign};
  ${color};
  ${fontWeight};
  ${space};
  ${letterSpacing};
  ${textTransform};
`;

export default Text;
