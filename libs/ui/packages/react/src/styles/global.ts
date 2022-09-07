import { createGlobalStyle } from "styled-components";

import { rgba } from "./helpers";
import tippyStyles from "../components/message/Tooltip/styles";
import { fontStyles } from "../components/asorted/Text/styles";

export type GlobalStyleProps = {
  fontsPath?: string;
  fontMappings?: (name: string) => string;
};

export const GlobalStyle = createGlobalStyle<GlobalStyleProps>`
  html {
    box-sizing: border-box;
  }

  body {
    font-family: Inter, sans-serif;
    font-size: 100%;
  }

  * {
    margin: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    user-select: inherit;
    cursor: inherit;
    outline: none;
  }

  ::selection {
    background: ${(p) => rgba(p.theme.colors.primary.c100, 0.1)};
  }

  --track-color: rgba(0,0,0,0);

  ${(props) => (typeof props.fontsPath === "string" ? fontStyles : "")}

  ${tippyStyles}

  ::-webkit-scrollbar              {
    width: 12px;
    height: 12px;
    background-color: rgba(0,0,0,0);
  }
  ::-webkit-scrollbar-button       {
    opacity: 0;
    height: 0;
    width: 0;
  }
  ::-webkit-scrollbar-track        {
    background-color: rgba(0,0,0,0);
  }
  ::-webkit-scrollbar-thumb        {
    box-shadow: inset 0 0 0 12px var(--track-color);
    border: 2px solid rgba(0,0,0,0);
    border-radius: 12px;
  }
  ::-webkit-scrollbar-corner {
    opacity: 0;
  }
`;
