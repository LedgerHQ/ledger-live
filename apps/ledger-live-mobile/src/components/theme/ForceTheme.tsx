import React from "react";
import StyleProvider from "../../StyleProvider";

export type Props = {
  children?: React.ReactNode;
  selectedPalette: "light" | "dark";
};

export default function ForceTheme({ children, selectedPalette }: Props): React.ReactElement {
  return <StyleProvider selectedPalette={selectedPalette}>{children}</StyleProvider>;
}
