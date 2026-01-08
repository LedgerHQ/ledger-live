import { Theme as UITheme } from "@ledgerhq/native-ui/styles/theme";

declare module "styled-components/native" {
  export interface DefaultTheme extends UITheme {}
}
