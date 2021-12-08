import React, { useMemo } from "react";
import { ThemeProvider, useTheme } from "styled-components";
import { defaultTheme } from ".";
import { palettes } from "@ledgerhq/ui-shared";
import { Theme } from "./theme";

export const InvertTheme = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => {
  const { theme } = useTheme();
  const revertTheme = theme === "light" ? "dark" : "light";
  const newTheme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      colors: { ...palettes[revertTheme], palette: palettes[revertTheme] },
      theme: revertTheme,
    }),
    [revertTheme],
  );

  return <ThemeProvider theme={newTheme}>{children}</ThemeProvider>;
};
