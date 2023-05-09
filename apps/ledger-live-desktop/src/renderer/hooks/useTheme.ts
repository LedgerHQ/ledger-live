import { useContext } from "react";
import { DefaultTheme, ThemeContext } from "styled-components";
import get from "lodash/get";

function useTheme(): DefaultTheme;
/**
 * @deprecated do not pass a path, it's not type safe
 */
function useTheme(path: string): any;

function useTheme(path?: string | undefined): any {
  const theme = useContext(ThemeContext);
  return path ? get(theme, path) : theme;
}

export default useTheme;
