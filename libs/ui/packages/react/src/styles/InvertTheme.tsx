import React, { useMemo } from "react";
import { ThemeProvider, useTheme } from "styled-components";
import { defaultTheme } from ".";
import { palettes } from "@ledgerhq/ui-shared";
import { Theme } from "./theme";
import { defaultTheme as V3dDfaultTheme, palettes as V3Palettes } from "@ledgerhq/react-ui/styles";

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

export const InvertThemeV3 = ({ children }: any): React.ReactElement => {
  const theme = useTheme();
  console.log(theme);
  const v3RevertTheme = theme.theme === "light" ? "dark" : "light";
  const newTheme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      ...V3dDfaultTheme,
      colors: {
        ...defaultTheme.colors,
        ...V3Palettes[v3RevertTheme],
        palette: { ...palettes[v3RevertTheme], ...V3Palettes[v3RevertTheme] },
      },
      theme: v3RevertTheme,
    }),
    [v3RevertTheme],
  );
  console.log("ok");
  return <ThemeProvider theme={newTheme}>{children}</ThemeProvider>;
};
