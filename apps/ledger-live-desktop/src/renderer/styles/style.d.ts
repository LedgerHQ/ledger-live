import { Theme as UITheme } from "@ledgerhq/react-ui/styles/theme";
import { Theme as OldTheme } from "./theme";

export module "styled-components" {
  export interface DefaultTheme {
    // This is unfortunately needed to make the old and the new themes work together :/
    colors: UITheme["colors"] & OldTheme["colors"];
  }
}
