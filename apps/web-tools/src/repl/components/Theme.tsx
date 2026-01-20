import React from "react";
import { ThemeProvider } from "styled-components";
import theme from "../theme";

export default ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);
