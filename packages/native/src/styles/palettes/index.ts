import dark from "./dark";
import light from "./light";

export type Theme = {
  type: string;
  primary: {
    c05: string;
    c20: string;
    c40: string;
    c60: string;
    c80: string;
    c100: string;
    c120: string;
    c140: string;
    c160: string;
    c180: string;
  };
  neutral: {
    c00: string;
    c20: string;
    c30: string;
    c40: string;
    c50: string;
    c60: string;
    c70: string;
    c80: string;
    c90: string;
    c100: string;
    c100a07: string;
  };
  success: {
    c05: string;
    c10: string;
    c20: string;
    c40: string;
    c60: string;
    c80: string;
    c100: string;
  };
  warning: {
    c05: string;
    c10: string;
    c20: string;
    c40: string;
    c60: string;
    c80: string;
    c100: string;
  };
  error: {
    c05: string;
    c10: string;
    c20: string;
    c40: string;
    c60: string;
    c80: string;
    c100: string;
  };
};

const palettes: { dark: Theme; light: Theme } = {
  dark,
  light,
};

export default palettes;
