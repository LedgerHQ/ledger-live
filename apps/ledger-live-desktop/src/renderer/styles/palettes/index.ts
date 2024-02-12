import Color from "color";
import light from "./light.json";
import dark from "./dark.json";

export type RawPalette = {
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

const shades = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
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
    text: shades.reduce(
      (acc, value) => {
        acc[`shade${value}` as keyof Theme["text"]] = Color(rawPalette.secondary.main)
          .alpha(value / 100)
          .toString();
        return acc;
      },
      {} as Theme["text"],
    ),
  };
};
const palettes: {
  dark: Theme;
  light: Theme;
} = Object.entries({
  light,
  dark,
}).reduce(
  (acc, [name, value]) => {
    const rawPalette: RawPalette = value as RawPalette;
    acc[name as "dark" | "light"] = enrichPalette(rawPalette);
    return acc;
  },
  {} as {
    dark: Theme;
    light: Theme;
  },
);
export default palettes;
