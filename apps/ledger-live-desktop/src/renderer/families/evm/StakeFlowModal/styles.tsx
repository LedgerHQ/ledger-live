import { Box } from "@ledgerhq/react-ui";
import { BaseStyledProps } from "@ledgerhq/react-ui/components/styled";
import styled, { DefaultTheme, StyledComponent } from "styled-components";

export const SCROLL_WIDTH = 18;
export const SHADOW_HEIGHT = 30;

export const IconButton = styled("button")`
  align-items: center;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  justify-content: center;
  outline: inherit;
  padding: 8px;
`;

interface IsScrollable {
  isScrollable: boolean;
}

export const ScrollableContainer: StyledComponent<
  "div",
  DefaultTheme,
  BaseStyledProps & IsScrollable,
  never
> = styled(Box)<IsScrollable>(
  ({ theme, isScrollable }) => `
  padding: 0px ${isScrollable ? 20 - SCROLL_WIDTH : 20}px 0px 20px;
  flex: 1;
  ${isScrollable ? theme.overflow.y : "overflow: hidden"};


  ::-webkit-scrollbar {
    width: ${SCROLL_WIDTH}px;
  }

  ::-webkit-scrollbar-thumb {
    box-shadow: inset 0 0 0 12px ${theme.colors.neutral.c40};
    border: 6px solid rgba(0,0,0,0);
    border-radius: 12px;
  }
`,
);

export const Header: StyledComponent<"div", DefaultTheme, BaseStyledProps & IsScrollable, never> =
  styled(Box)<IsScrollable>(
    ({ isScrollable, theme }) => `
   position: relative;
   ${
     isScrollable
       ? `
        ::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 0;
            right: ${SCROLL_WIDTH}px;
            height: ${SHADOW_HEIGHT}px;
            background: linear-gradient(to bottom, ${theme.colors.background.main}, transparent);
            z-index: 1;
            pointer-events: none;
          }
        `
       : ""
   }
`,
  );

export const Footer: StyledComponent<"div", DefaultTheme, BaseStyledProps & IsScrollable, never> =
  styled(Box)<IsScrollable>(
    ({ isScrollable, theme }) => `
    position: relative;

    ${
      isScrollable
        ? `
          ::before {
              content: "";
              position: absolute;
              bottom: 100%;
              left: 0;
              right: ${SCROLL_WIDTH}px;
              height: ${SHADOW_HEIGHT}px;
              background: linear-gradient(to top, ${theme.colors.background.main}, transparent);
              z-index: 1;
              pointer-events: none;
            }
        `
        : ""
    }

  `,
  );
