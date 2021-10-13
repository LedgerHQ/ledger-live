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
  SpaceProps,
  layout,
  LayoutProps,
} from "styled-system";
import fontFamily from "@ui/styles/styled/fontFamily";
import "./Text.css";

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
type TextTypes =
  | "h1"
  | "h2"
  | "h3"
  | "highlight"
  | "emphasis"
  | "body"
  | "cta"
  | "link"
  | "tiny"
  | "subTitle"
  | "navigation"
  | "tag"
  | "paragraph";

export interface TextProps {
  fontFamily?: string;
  ff?: FontFamilies;
  fontSize?: number | string;
  textAlign?: string;
  textTransform?: string;
  color?: string;
  fontWeight?: string;
  mt?: number | string;
  mb?: number | string;
  ml?: number | string;
  mr?: number | string;
  lineHeight?: string;
  bracket?: boolean;
  type?: TextTypes;
  children: React.ReactNode;
}

export interface BaseTextProps extends SpaceProps, LayoutProps {
  fontFamily?: string;
  ff?: FontFamilies;
  fontSize?: number | string;
  textAlign?: string;
  color?: string;
  fontWeight?: string;
  lineHeight?: string;
  type?: TextTypes;
  textTransform?: string;
  textOverflow?: string;
}

const Text = styled.span.attrs((p: BaseTextProps) => ({
  color: p.color || "palette.neutral.c100",
  className: `${p.type ? `ll-text_${p.type} ` : ""}`,
}))<BaseTextProps>`
  ${uppercase};
  ${lineHeight};
  ${fontFamily};
  ${fontSize};
  ${textAlign};
  ${color};
  ${fontWeight};
  ${space};
  ${letterSpacing};
  ${layout}
  ${system({
    textOverflow: true,
  })}
  ${(p) => (p.textTransform ? `text-transform: ${p.textTransform};` : "")}
`;

export default Text;
