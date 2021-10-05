import dark from "./dark.json";
import light from "./light.json";

type DarkPalette = typeof dark;
type LightPalette = typeof light;

const palettes: { dark: DarkPalette; light: LightPalette } = {
  dark,
  light,
};

export default palettes;
