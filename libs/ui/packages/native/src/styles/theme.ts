import { ColorPalette, palettes } from "@ledgerhq/ui-shared";

//                    0  1  2  3  4   5   6   7   8   9   10  11  12  13  14
export const space = [0, 2, 4, 8, 12, 14, 16, 24, 32, 40, 48, 64, 80, 96, 120];

export const textVariants = [
  "h1",
  "h1Inter",
  "h2",
  "h3",
  "h4",
  "h5",
  "large",
  "largeLineHeight",
  "body",
  "bodyLineHeight",
  "paragraph",
  "paragraphLineHeight",
  "small",
  "subtitle",
  "tiny",
  "tinyAlpha",
] as const;

export type TextVariants = typeof textVariants[number];

export type ThemeScale<Type, Aliases extends string> = Array<Type> & Record<Aliases, Type>;

//                        0   1   2   3   4   5   6   7   8   9
export const fontSizes = [10, 11, 12, 13, 14, 16, 18, 24, 28, 32] as ThemeScale<
  number,
  TextVariants
>;

[
  fontSizes.tiny,
  fontSizes.subtitle,
  fontSizes.small,
  fontSizes.paragraph,
  fontSizes.body,
  fontSizes.large,
  fontSizes.h3,
  fontSizes.h2,
  fontSizes.h1,
  fontSizes.h1Inter,
] = fontSizes;
fontSizes.bodyLineHeight = fontSizes.body;
fontSizes.paragraphLineHeight = fontSizes.paragraph;
fontSizes.largeLineHeight = fontSizes.large;
fontSizes.h4 = fontSizes.h2;
fontSizes.h5 = fontSizes.h3;
fontSizes.tinyAlpha = fontSizes.tiny;

export const radii = [0, 4, 8];
export const zIndexes = [-1, 0, 1, 9, 10, 90, 100, 900, 1000];

export type Theme = {
  theme: "light" | "dark";
  sizes: {
    topBarHeight: number;
    sideBarWidth: number;
  };
  radii: number[];
  fontSizes: number[];
  space: number[];
  colors: ColorPalette & {
    /**
     * @deprecated Do not use the .palette prefix anymore!
     */
    palette: ColorPalette;
  };
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
    ...palettes.light,
    palette: palettes.light,
  },
  zIndexes,
};

export default theme;
