import dark from "./dark";
import light from "./light";

export type Theme = {
  type: string;
  primary: {
    backgroundLight: string;
    backgroundMedium: string;
    borderMedium: string;
    base: string;
    borderDark: string;
    dark: string;
  };
  orange: {
    error: string;
    secondaryText: string;
    main: string;
  };
  text: {
    default: string;
    secondary: string;
    tertiary: string;
    contrast: string;
  };
  grey: {
    border: string;
  };
  feedback: {
    error: string;
    successText: string;
    success: string;
  };
  background: {
    nav: string;
    default: string;
    overlay: string;
    grey: string;
  };
};

const palettes: { dark: Theme; light: Theme } = {
  dark,
  light,
};

export default palettes;
