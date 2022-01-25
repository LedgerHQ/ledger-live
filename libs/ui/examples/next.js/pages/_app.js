import React from "react";
import { StyleProvider } from "@ledgerhq/react-ui";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
  }
`;

export default function App({ Component, pageProps }) {
  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  return (
    <StyleProvider selectedPalette={palette} fontsPath="fonts">
      <GlobalStyle />
      <Component {...pageProps} isLight={isLight} setPalette={setPalette} />
    </StyleProvider>
  );
}
