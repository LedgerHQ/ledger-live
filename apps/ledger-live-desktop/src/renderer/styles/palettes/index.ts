import Color from "color";
import light from "./light.json";
import dark from "./dark.json";
const shades = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
type RawPalette = {
  type: "light" | "dark";
  primary: {
    main: string;
    contrastText: string;
  };
  secondary: {
    main: string;
  };
  divider: string;
  background: {
    paper: string;
    default: string;
    wave: string;
  };
  action: {
    active: string;
    hover: string;
    disabled: string;
  };
  wave: string;
};
export type Theme = {
  text: {
    shade5: string;
    shade10: string;
    shade20: string;
    shade30: string;
    shade40: string;
    shade50: string;
    shade60: string;
    shade70: string;
    shade80: string;
    shade90: string;
    shade100: string;
  };
} & RawPalette;
const enrichPalette = (rawPalette: RawPalette): Theme => {
  return {
    ...rawPalette,
    text: shades.reduce((acc, value) => {
      acc[`shade${value}`] = Color(rawPalette.secondary.main)
        .alpha(value / 100)
        .toString();
      return acc;
    }, {}),
  };
};
const palettes: {
  dark: RawPalette;
  light: RawPalette;
} = Object.entries({
  light,
  dark,
}).reduce((acc, [name, value]) => {
  const rawPalette: RawPalette = value as any;
  acc[name] = enrichPalette(rawPalette);
  return acc;
}, {});
export default palettes;
