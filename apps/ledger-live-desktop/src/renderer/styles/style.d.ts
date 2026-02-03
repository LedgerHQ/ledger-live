import { Theme as UITheme } from "@ledgerhq/react-ui/styles/theme";
import { Theme as OldTheme } from "./theme";

export module "styled-components" {
  export interface DefaultTheme {
    // This is unfortunately needed to make the old and the new themes work together :/
    colors: UITheme["colors"] & OldTheme["colors"];
    overflow: UITheme["overflow"] & OldTheme["overflow"];
    animations: UITheme["animations"] & OldTheme["animations"];
    space: UITheme["space"] & OldTheme["space"];
    radii: UITheme["radii"] & OldTheme["radii"];
    fontFamilies: UITheme["fontFamilies"] & OldTheme["fontFamilies"];
    fontSizes: UITheme["fontSizes"] & OldTheme["fontSizes"];
    shadows: UITheme["shadows"] & OldTheme["shadows"];
    fontWeights: UITheme["fontWeights"] & OldTheme["fontWeights"];
    breakpoints: UITheme["breakpoints"] & OldTheme["breakpoints"];
    zIndexes: UITheme["zIndexes"] & OldTheme["zIndexes"];
    sizes: UITheme["sizes"] & OldTheme["sizes"];
    theme: UITheme["theme"];
  }
}
