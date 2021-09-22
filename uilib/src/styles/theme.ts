export const space = [0, 5, 10, 15, 20, 30, 44, 50, 70];
export const fontSizes = [8, 9, 10, 12, 13, 16, 18, 22, 32];
export const radii = [0, 4];
export const zIndexes = [-1, 0, 1, 9, 10, 90, 100, 900, 1000];

// @Rebrand remove this
const colors = {
  transparent: "transparent",
  pearl: "#ff0000",
  alertRed: "#ea2e49",
  warning: "#f57f17",
  black: "#000000",
  dark: "#142533",
  separator: "#aaaaaa",
  fog: "#d8d8d8",
  gold: "#d6ad42",
  graphite: "#767676",
  grey: "#999999",
  identity: "#41ccb4",
  lightFog: "#eeeeee",
  sliderGrey: "#F0EFF1",
  lightGraphite: "#fafafa",
  lightGrey: "#f9f9f9",
  starYellow: "#FFD24A",
  orange: "#ffa726",
  positiveGreen: "rgba(102, 190, 84, 1)",
  greenPill: "#41ccb4",
  smoke: "#666666",
  wallet: "#6490f1",
  blueTransparentBackground: "rgba(100, 144, 241, 0.15)",
  pillActiveBackground: "rgba(100, 144, 241, 0.1)",
  lightGreen: "rgba(102, 190, 84, 0.1)",
  lightRed: "rgba(234, 46, 73, 0.1)",
  lightWarning: "rgba(245, 127, 23, 0.1)",
  white: "#ffffff",
  experimentalBlue: "#165edb",
};

// prettier-ignore
const exportedColors = colors;

export { exportedColors as colors };

export type Theme = {
  sizes: {
    topBarHeight: number;
    sideBarWidth: number;
  };
  radii: number[];
  fontSizes: number[];
  space: number[];
  colors: Record<string, any>;
  zIndexes: number[];
};

const theme: Theme = {
  sizes: {
    topBarHeight: 58,
    sideBarWidth: 230,
  },
  radii,
  fontSizes,
  space,
  colors,
  zIndexes,
};

export default theme;
