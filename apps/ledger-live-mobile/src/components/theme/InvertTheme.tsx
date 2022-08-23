import React, { useMemo } from "react";
import { ThemeProvider, useTheme } from "styled-components/native";
import { defaultTheme, palettes } from "@ledgerhq/native-ui/styles";
import StyleProvider from "../../StyleProvider";

export default function InvertTheme({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const { theme } = useTheme();
  const revertTheme = theme === "light" ? "dark" : "light";

  return (
    <StyleProvider selectedPalette={revertTheme}>{children}</StyleProvider>
  );
}
