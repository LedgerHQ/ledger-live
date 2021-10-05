import dark from "./dark.json";
import light from "./light.json";

export type ThemeNames = "dark" | "light";
export type Palette = typeof dark | typeof light;

const palettes: { dark: Palette; light: Palette } = {
  dark,
  light,
};

export default palettes;
