import baseStyled, { BaseStyledProps } from "../../styled";
import {
  compose,
  fontSize,
  fontWeight,
  textAlign,
  lineHeight,
  letterSpacing,
  system,
} from "styled-system";
import fontFamily from "../../../styles/styled/fontFamily";
import { TextVariants } from "../../../styles/theme";
import { textVariantStyle } from "./styles";

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

type WhiteSpace = "normal" | "nowrap" | "pre" | "pre-line" | "pre-wrap";

export interface TextProps extends BaseStyledProps {
  fontFamily?: string;
  ff?: FontFamilies;
  fontSize?: number | string | TextVariants;
  variant?: TextVariants;
  textAlign?: string;
  fontWeight?: string;
  lineHeight?: string;
  textTransform?: string;
  textOverflow?: string;
  uppercase?: boolean;
  whiteSpace?: WhiteSpace;
}

const Text = baseStyled.span.attrs<TextProps, TextProps>(
  ({ variant = "body", fontSize, color }) => ({
    fontSize: fontSize ? fontSize : variant,
    color: color || "neutral.c100",
  }),
)`
  font-weight: 500;
  white-space: ${(props) => props.whiteSpace ?? "normal"};
  ${(p: TextProps) => textVariantStyle[p.variant || "body"]}
  ${compose(
    uppercase,
    lineHeight,
    fontFamily,
    fontSize,
    textAlign,
    fontWeight,
    letterSpacing,
    system({
      textOverflow: true,
    }),
  )}
  ${(p) => (p.textTransform ? `text-transform: ${p.textTransform};` : "")}
`;

export default Text;
