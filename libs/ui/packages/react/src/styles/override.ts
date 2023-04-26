import { Theme } from "./theme";
declare module "styled-components" {
  export interface Font {
    weight: number;
    style: string;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends Theme {}
}
