import React, { useMemo } from "react";
import { ThemeProvider, useTheme } from "styled-components";
import { defaultTheme } from ".";
import { palettes } from "@ledgerhq/ui-shared";
import { Theme } from "./theme";

export type Props = {
  if?: boolean;
};

export const InvertTheme = ({
  if: condition,
  children,
}: React.PropsWithChildren<Props>): React.ReactElement => {
  const theme = useTheme();
  const revertTheme = theme.theme === "light" ? "dark" : "light";
  const newTheme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      colors: { ...palettes[revertTheme], palette: palettes[revertTheme] },
      theme: revertTheme,
    }),
    [revertTheme],
  );

  return <ThemeProvider theme={condition ? newTheme : theme}>{children}</ThemeProvider>;
};
