import React from "react";
import StyleProvider from "../../StyleProvider";

export default function ForceTheme({
  children,
  selectedPalette,
}: {
  children?: React.ReactNode;
  selectedPalette: "light" | "dark";
}): React.ReactElement {
  return (
    <StyleProvider selectedPalette={selectedPalette}>{children}</StyleProvider>
  );
}
