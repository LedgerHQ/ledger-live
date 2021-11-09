import React from "react";
import { StyleProvider } from "@ledgerhq/react-ui";

export default function App({ Component, pageProps }) {
  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  return (
    <StyleProvider selectedPalette={palette} fontsPath="fonts">
      <Component {...pageProps} isLight={isLight} setPalette={setPalette} />
    </StyleProvider>
  );
}
