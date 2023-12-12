import { Flex, Text } from "@ledgerhq/react-ui";
import styled, { css, StyledComponent, DefaultTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";

const highlightedTheme = {
  light: css`
        border: 1px solid #B5ABF0;
        background:linear-gradient(101deg, #765EBB 4.88%, #B5ABF0 93.03%);
        color: white !important;
        &:hover,
        &:focus {
          cursor: pointer;
          filter: brightness(0.9);
          border:1px solid rgba(187, 176, 255, 0.50);
        `,
  dark: css`
        border: 1px solid #37304B;
        background:linear-gradient(101deg, #57536E 4.88%, #37304B 93.03%);
        &:hover,
        &:focus {
          cursor: pointer;
          background:linear-gradient(101deg, #736D95 4.88%, #443962 93.03%);
          border:1px solid rgba(187, 176, 255, 0.50);
        `,
};

export const Container: StyledComponent<
  "div",
  DefaultTheme,
  React.ComponentProps<typeof Flex> & { disabled: boolean; highlighted: boolean }
> = styled(Flex).attrs<{
  disabled: boolean;
  highlighted: boolean;
}>(p => ({
  borderStyle: "solid",
  borderWidth: 1,
  borderRadius: 8,
  borderColor: "opacityDefault.c05",
  flexDirection: "column",
  padding: 3,
  opacity: p.disabled ? 0.5 : 1,
}))<{ disabled: boolean; highlighted: boolean }>`
  ${p =>
    p.disabled
      ? css`
          img {
            filter: grayscale(100%);
          }
        `
      : p.highlighted
      ? highlightedTheme[p.theme.colors.palette.type]
      : css`
          &:hover,
          &:focus {
            cursor: pointer;
            box-shadow: 0px 0px 0px 4px ${rgba(p.theme.colors.primary.c70, 0.25)};
            border: 1px solid ${p.theme.colors.primary.c70};
         `}
`;

export const Subtitle = styled(Text).attrs({
  variant: "small",
  color: "neutral.c100a07",
  flex: 1,
  overflowX: "scroll",
  whiteSpace: "nowrap",
  fontSize: 12,
})`
  ::-webkit-scrollbar {
    display: none;
  }
`;
