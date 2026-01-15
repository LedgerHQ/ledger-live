import React from "react";
import { createRoot } from "react-dom/client";
import { StyleProvider } from "@ledgerhq/react-ui";
import { createGlobalStyle } from "styled-components";

import Home from "../pages/index";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
  }
`;

const Root = () => {
  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  return (
    <StyleProvider selectedPalette={palette} fontsPath="assets/fonts">
      <GlobalStyle />
      <Home isLight={isLight} setPalette={setPalette} />
    </StyleProvider>
  );
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<Root />);
