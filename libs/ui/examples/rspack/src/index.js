import React from "react";
import ReactDOM from "react-dom";
import { StyleProvider } from "@ledgerhq/react-ui";
import "@ledgerhq/react-ui/assets/fonts";
import { App } from "./App";

function Root({ children }) {
  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  return (
    <StyleProvider selectedPalette={palette} fontsPath="assets/fonts">
      <App isLight={isLight} setPalette={setPalette} />
    </StyleProvider>
  );
}

ReactDOM.render(<Root />, document.getElementById("root"));
