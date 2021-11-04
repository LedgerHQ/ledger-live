import { ColorPalette, palettes } from "@ledgerhq/ui-shared";

export const space = [0, 2, 4, 8, 12, 14, 16, 24, 32, 40, 48, 64, 80, 96, 120];
export const fontSizes = [8, 9, 10, 12, 13, 16, 18, 22, 32];
export const radii = [0, 4, 8];
export const zIndexes = [-1, 0, 1, 9, 10, 90, 100, 900, 1000];

export type Theme = {
  theme: string;
  sizes: {
    topBarHeight: number;
    sideBarWidth: number;
  };
  radii: number[];
  fontSizes: number[];
  space: number[];
  colors: { palette: ColorPalette };
  zIndexes: number[];
};

const theme: Theme = {
  theme: "light",
  sizes: {
    topBarHeight: 58,
    sideBarWidth: 230,
  },
  radii,
  fontSizes,
  space,
  colors: {
    palette: palettes.light,
  },
  zIndexes,
};

export default theme;
