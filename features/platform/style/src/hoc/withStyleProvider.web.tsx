import React from "react";
import { StyleProvider } from "../components";
import { useTheme } from "../hooks";

/** Re-injects the styled-components theme context into an isolated React root. */
export function withStyleProvider<P extends object>(Component: React.ComponentType<P>) {
  return function WithStyleProvider(props: P) {
    const theme = useTheme();
    return (
      <StyleProvider theme={theme}>
        <Component {...props} />
      </StyleProvider>
    );
  };
}
