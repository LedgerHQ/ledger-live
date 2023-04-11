import { Flex, Text } from "@ledgerhq/react-ui";
import styled, { css, StyledComponent, DefaultTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";

export const Container: StyledComponent<
  "div",
  DefaultTheme,
  React.ComponentProps<typeof Flex> & { disabled: boolean }
> = styled(Flex).attrs<{
  disabled: boolean;
}>(p => ({
  borderStyle: "solid",
  borderWidth: 1,
  borderRadius: 8,
  borderColor: "opacityDefault.c05",
  flexDirection: "column",
  padding: 3,
  backgroundColor: "opacityDefault.c05",
  opacity: p.disabled ? 0.5 : 1,
}))<{ disabled: boolean }>`
  ${p =>
    p.disabled
      ? css`
          img {
            filter: grayscale(100%);
          }
        `
      : css`
        &:hover,
        &:focus {
          cursor: pointer;
          box-shadow: 0px 0px 0px 4px ${rgba(p.theme.colors.primary.c70, 0.25)};
          border: 1px solid ${p.theme.colors.primary.c70};
      `}
  }
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
