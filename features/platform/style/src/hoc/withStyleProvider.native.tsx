import React from "react";
import { ThemeProvider } from "styled-components/native";
import { useTheme } from "../hooks/useTheme.native";

/** Re-injects the styled-components/native theme context into an isolated React sub-tree. */
export function withStyleProvider<P extends object>(Component: React.ComponentType<P>) {
  return function WithStyleProvider(props: P) {
    const theme = useTheme();
    return (
      <ThemeProvider theme={theme}>
        <Component {...props} />
      </ThemeProvider>
    );
  };
}
