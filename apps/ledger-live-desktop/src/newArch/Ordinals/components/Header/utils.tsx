import { Flex } from "@ledgerhq/react-ui";
import styled, { DefaultTheme, StyledComponent } from "styled-components";

export const primary: string = "primary.c80";
export const neutral: string = "neutral.c70";

export const Element: StyledComponent<"div", DefaultTheme, Record<string, unknown>, never> = styled(
  Flex,
)`
  &:hover {
    cursor: pointer;
  }
`;
