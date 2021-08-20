// import original module declarations
import "styled-components";
import "styled-components/native";
import { Theme } from "./theme";

// and extend them!
declare module "styled-components" {
  export interface DefaultTheme extends Theme {
    sizes: {
      topBarHeight: number;
      sideBarWidth: number;
    };
    radii: number[];
    fontSizes: number[];
    space: number[];
    colors: Record<string, any>;
    zIndexes: number[];
  }
}
