import React from "react";
import styled from "styled-components";
import { fontSize, fontWeight, textAlign, lineHeight, letterSpacing, system } from "styled-system";
import fontFamily from "../../../styles/styled/fontFamily";
import { fontWeights, TextVariants } from "../../../styles/theme";
import { textVariantStyle } from "./styles";
import { sharedStyle, SharedStyleProps } from "../../../styles/system/shared";

const uppercase = system({
  uppercase: {
    property: "textTransform",
    transform: (value) => (value ? "uppercase" : "none"),
  },
});

type FontFamilies =
  | "Inter|ExtraLight"
  | "Inter|Light"
  | "Inter|Regular"
  | "Inter|Medium"
  | "Inter|SemiBold"
  | "Inter|Bold"
  | "Inter|ExtraBold"
  | "Alpha|Medium";

export interface TextProps {
  fontFamily?: string;
  ff?: FontFamilies;
  fontSize?: number | string | TextVariants;
  variant?: TextVariants;
  textAlign?: string;
  textTransform?: string;
  fontWeight?: string;
  lineHeight?: string;
  children: React.ReactNode;
}

export type BaseTextProps = React.HTMLAttributes<HTMLSpanElement> &
  SharedStyleProps & {
    fontFamily?: string;
    ff?: FontFamilies;
    fontSize?: number | string | TextVariants;
    variant?: TextVariants;
    textAlign?: string;
    fontWeight?: keyof typeof fontWeights | string;
    lineHeight?: string;
    textTransform?: string;
    textOverflow?: string;
  };

const Text = styled.span.attrs<BaseTextProps>(({ variant = "body", fontSize, color }) => ({
  fontSize: fontSize ? fontSize : variant,
  color: color ?? "palette.neutral.c100",
}))<BaseTextProps>`
  font-weight: 500;
  ${(p) => textVariantStyle[p.variant || "body"]}
  ${sharedStyle}
  ${uppercase};
  ${lineHeight};
  ${fontFamily};
  ${fontSize};
  ${textAlign};
  ${fontWeight};
  ${letterSpacing};
  ${system({
    textOverflow: true,
  })}
  ${(p) => (p.textTransform ? `text-transform: ${p.textTransform};` : "")}
`;

export default Text;
