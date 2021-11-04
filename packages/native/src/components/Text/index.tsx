import React from "react";
import { TextProps } from "react-native";
import styled, { useTheme } from "styled-components/native";
import {
  fontSize,
  FontSizeProps,
  textAlign,
  TextAlignProps,
  color,
  ColorProps,
  space,
  SpaceProps,
  lineHeight,
  LineHeightProps,
  border,
  BorderProps,
} from "styled-system";

import BracketRight from "../../icons/BracketLeft";
import BracketLeft from "../../icons/BracketRight";
import { getColor } from "../../styles";
import { FontWeightTypes, getTextStyle, TextTypes } from "./getTextStyle";

interface Props
  extends TextProps,
    FontSizeProps,
    TextAlignProps,
    ColorProps,
    SpaceProps,
    LineHeightProps,
    BorderProps {
  type?: TextTypes;
  fontWeight?: FontWeightTypes;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  mt?: number | string;
  mb?: number | string;
  ml?: number | string;
  mr?: number | string;
  paddingTop?: number;
  lineHeight?: number;
  bracket?: boolean;
  children: React.ReactNode;
}

const Base = styled.Text.attrs((p: Props) => ({
  ...getTextStyle(p),
  color: p.color || "palette.neutral.c100",
}))<Props>`
  ${lineHeight};
  ${fontSize};
  ${textAlign};
  ${color};
  ${space};
  ${border};
  justify-content: center;
  align-items: center;
`;

const T = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const BracketText = ({
  children,
  color = "palette.neutral.c100",
  lineHeight,
  ...props
}: Props) => {
  const size = lineHeight || getTextStyle(props).lineHeight;
  const theme = useTheme();
  const c: string = theme ? (getColor(theme, color) as string) : "transparent";
  return (
    <T>
      <BracketLeft fill={c} width={size} height={size} />
      <Base {...props} color={color} bracket>
        {children}
      </Base>
      <BracketRight fill={c} width={size} height={size} />
    </T>
  );
};

const Text = ({ children, bracket, ...props }: Props) => {
  if (bracket) return <BracketText {...props}>{children}</BracketText>;

  return <Base {...props}>{children}</Base>;
};

export default Text;
