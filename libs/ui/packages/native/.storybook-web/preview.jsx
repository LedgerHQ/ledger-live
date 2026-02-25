import React from "react";
import { palettes } from "@ledgerhq/ui-shared";
import { FontProvider, Main } from "../storybook/stories/CenterView";
import { StyleProvider } from "../src/styles/StyleProvider";
import interMedium from "../src/assets/fonts/inter/Inter-Medium.otf";
import interSemiBold from "../src/assets/fonts/inter/Inter-SemiBold.otf";
import interBold from "../src/assets/fonts/inter/Inter-Bold.otf";
import alphaMonoMedium from "../src/assets/fonts/alpha/HMAlphaMono-Medium.otf";

const fontFaces = `
@font-face {
  font-family: "Inter-Medium";
  src: url(${interMedium}) format("opentype");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Inter-SemiBold";
  src: url(${interSemiBold}) format("opentype");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Inter-Bold";
  src: url(${interBold}) format("opentype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "HMAlphaMono-Medium";
  src: url(${alphaMonoMedium}) format("opentype");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
`;

export const decorators = [
  (Story, { globals }) => {
    const backgrounds = globals?.backgrounds ?? {};
    const theme =
      backgrounds?.value === palettes.dark.background.main
        ? "dark"
        : "light";
    return (
      <div
        style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}
      >
        <style>
          {
            `${fontFaces}
          body { padding: 0!important;}
          *:focus, *:active {
            outline: none !important;
          }` /* outline custom styling used to mask focus boxes on safari & chrome */
          }
        </style>
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
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    disable: true,
  },
};
