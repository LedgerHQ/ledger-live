import { Theme } from "./theme";
declare module "styled-components" {
  export interface Font {
    weight: number;
    style: string;
  }
  // oxlint-disable-next-line typescript/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}
