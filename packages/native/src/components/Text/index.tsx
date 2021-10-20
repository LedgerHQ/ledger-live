import React from "react";
import styled, { useTheme } from "styled-components/native";

import {
  fontSize,
  textAlign,
  color,
  space,
  lineHeight,
  border,
} from "styled-system";
import BracketRight from "@ui/icons/BracketLeft";
import BracketLeft from "@ui/icons/BracketRight";
import { getColor } from "@ui/styles";
import { FontWeightTypes, getTextStyle, TextTypes } from "./getTextStyle";
import { TextProps } from "react-native";

type Props = {
  type?: TextTypes;
  fontWeight?: FontWeightTypes;
  fontFamily?: string;
  fontSize?: number | string;
  textAlign?: string;
  color?: string;
  mt?: number | string;
  mb?: number | string;
  ml?: number | string;
  mr?: number | string;
  lineHeight?: string;
  bracket?: boolean;
  children: React.ReactNode;
} & TextProps;

const Base = styled.Text<Props>`
  ${lineHeight};
  ${fontSize};
  ${textAlign};
  ${color};
  ${space};
  ${border};
  ${(p) => getTextStyle(p)}
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
  ...props
}: Props) => {
  const { lineHeight: size } = getTextStyle(props);
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
