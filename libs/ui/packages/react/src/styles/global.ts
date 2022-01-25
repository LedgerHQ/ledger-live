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
    font-family: Inter;
    font-size: 100%;
  }

  *, *:before, *:after {
    box-sizing: inherit;
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
`;
