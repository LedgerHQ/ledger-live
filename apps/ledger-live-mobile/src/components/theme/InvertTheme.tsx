import React from "react";
import { useTheme } from "styled-components/native";
import StyleProvider from "../../StyleProvider";

export default function InvertTheme({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const { theme } = useTheme();
  const revertTheme = theme === "light" ? "dark" : "light";

  return <StyleProvider selectedPalette={revertTheme}>{children}</StyleProvider>;
}
