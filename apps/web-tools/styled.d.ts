import "styled-components";
import theme from "./repl/theme";

type Theme = typeof theme;

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}
