import dark from "./dark";
import light from "./light";

export type Theme = {
  type: string;
  primary: {
    c10: string;
    c20: string;
    c30: string;
    c40: string;
    c60: string;
    c70: string;
    c80: string;
    c100: string;
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
  };
  success: {
    c10: string;
    c30: string;
    c40: string;
    c50: string;
    c60: string;
    c80: string;
    c100: string;
  };
  warning: {
    c10: string;
    c30: string;
    c40: string;
    c50: string;
    c60: string;
    c80: string;
    c100: string;
  };
  error: {
    c10: string;
    c30: string;
    c40: string;
    c50: string;
    c60: string;
    c80: string;
    c100: string;
  };
  environment: {
    background: string;
    overlay: string;
  };
};

const palettes: { dark: Theme; light: Theme } = {
  dark,
  light,
};

export default palettes;
