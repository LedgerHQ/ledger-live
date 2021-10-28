import React from "react";
import { palettes } from "@ledgerhq/ui-shared";

import { StyleProvider } from "../src/styles";

export const decorators = [
  (Story, { globals }) => {
    const backgrounds = globals?.backgrounds ?? {};
    const theme = backgrounds?.value === palettes.dark.background.main ? "dark" : "light";
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
        value: palettes.light.background.main,
      },
      {
        name: "dark",
        value: palettes.dark.background.main,
      },
    ],
  },
};
