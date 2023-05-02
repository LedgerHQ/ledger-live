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
  uppercase?: boolean;
  capitalize?: boolean;
  ff?: string;
  fontFamily?: string;
  textAlign?: string;
  color?: string;
  align?: "DEPRECATED: USE textAlign INSTEAD";
  lineHeight?: string;
  textTransform?: string;
} & FontSizeProps &
  FontWeightProps &
  LineHeightProps &
  ColorProps &
  SpaceProps &
  TextAlignProps &
  LetterSpacingProps;

const Text = styled.span<TextProps>`
  ${uppercase};
  ${p => (p.capitalize ? `text-transform: capitalize;` : "")};
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
