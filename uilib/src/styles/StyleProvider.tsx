import React, { useMemo, ComponentType } from "react";
import { ThemeProvider } from "styled-components/native";
import { StyledComponent } from "styled-components";
import defaultTheme from "./theme";
import palettes from "./palettes";
import { Theme } from "./theme";

type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};

export type ThemedComponent<T> = StyledComponent<ComponentType<T>, Theme, any>;

const StyleProvider = ({
  children,
  selectedPalette,
}: Props): React.ReactElement => {
  const theme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        palette: palettes[selectedPalette],
      },
    }),
    [selectedPalette],
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default StyleProvider;
