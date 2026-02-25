import { useContext } from "react";
import { DefaultTheme, ThemeContext } from "styled-components";

function useTheme(): DefaultTheme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return theme;
}

export default useTheme;
