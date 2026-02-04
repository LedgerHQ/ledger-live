import { Flex, Text } from "@ledgerhq/react-ui";
import styled, { css } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";

const highlightedTheme = {
  light: css`
    border: 1px solid #b5abf0;
    background: linear-gradient(101deg, #765ebb 4.88%, #b5abf0 93.03%);
    color: white !important;
    &:hover,
    &:focus {
      cursor: pointer;
      filter: brightness(0.9);
      border: 1px solid rgba(187, 176, 255, 0.5);
    }
  `,
  dark: css`
    border: 1px solid #37304b;
    background: linear-gradient(101deg, #57536e 4.88%, #37304b 93.03%);
    &:hover,
    &:focus {
      cursor: pointer;
      background: linear-gradient(101deg, #736d95 4.88%, #443962 93.03%);
      border: 1px solid rgba(187, 176, 255, 0.5);
    }
  `,
};

interface ContainerProps {
  disabled: boolean;
  highlighted: boolean;
}

export const Container = styled(Flex).attrs<ContainerProps>(p => ({
  borderStyle: "solid",
  borderWidth: 1,
  borderRadius: 8,
  borderColor: "opacityDefault.c05",
  flexDirection: "column",
  padding: 3,
  opacity: p.disabled ? 0.5 : 1,
}))<ContainerProps>`
  ${p =>
    p.disabled
      ? css`
          img {
            filter: grayscale(100%);
          }
        `
      : p.highlighted
        ? highlightedTheme[p.theme.theme]
        : css`
            &:hover,
            &:focus {
              cursor: pointer;
              box-shadow: 0px 0px 0px 4px ${rgba(p.theme.colors.primary.c70, 0.25)};
              border: 1px solid ${p.theme.colors.primary.c70};
            }
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
