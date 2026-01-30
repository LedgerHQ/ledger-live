"use client";
import React from "react";
import { createRoot } from "react-dom/client";
import { StyleProvider } from "@ledgerhq/react-ui";
import "@ledgerhq/react-ui/assets/fonts";
import { App } from "./App";

function Root() {
  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  return (
    <StyleProvider selectedPalette={palette} fontsPath="assets/fonts">
      <App isLight={isLight} setPalette={setPalette} />
    </StyleProvider>
  );
}

// eslint-disable-next-line no-undef
const root = createRoot(document.getElementById("root"));
root.render(<Root />);
