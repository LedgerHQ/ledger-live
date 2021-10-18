import React from "react";
import { StyleProvider } from "../src/styles";

export const decorators = [
  (Story, { globals }) => {
    const backgrounds = globals?.backgrounds ?? {};
    const theme = backgrounds?.value === "#1C1D1F" ? "dark" : "light";
    return (
      <StyleProvider fontsPath="assets/fonts" selectedPalette={theme}>
        <Story />
      </StyleProvider>
    );
  },
];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: "light",
    values: [
      {
        name: "light",
        value: "#FFFFFF",
      },
      {
        name: "dark",
        value: "#1C1D1F",
      },
    ],
  },
};
