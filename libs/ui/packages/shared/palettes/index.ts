import dark from "./dark";
import light from "./light";

export type ThemeNames = keyof typeof palettes;
export type ColorPalette = typeof dark | typeof light;

export const palettes: { dark: ColorPalette; light: ColorPalette } = {
  dark,
  light,
};
