import React from "react";
import { FontProvider, Main } from "../storybook/stories/CenterView";
import { palettes } from "@ledgerhq/ui-shared";
import { StyleProvider } from "../src/styles/StyleProvider";

export const decorators = [
  (Story, { globals }) => {
    const backgrounds = globals?.backgrounds ?? {};
    const theme = backgrounds?.value === palettes.dark.background.main ? "dark" : "light";

    return (
      <div
        style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}
      >
        <style> {`body { padding: 0!important;}`}</style>
        <StyleProvider selectedPalette={theme}>
          <FontProvider>
            <Main>
              <Story />
            </Main>
          </FontProvider>
        </StyleProvider>
      </div>
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
