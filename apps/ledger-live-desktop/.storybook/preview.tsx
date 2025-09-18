import React from "react";
import type { Preview } from "@storybook/react";
import { palettes, StyleProvider } from "../../../libs/ui/packages/react/src/styles";
import "../src/renderer/i18n/init";
import { Buffer } from "buffer";

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

window.Buffer = Buffer;

export const decorators = [
  (Story, { globals }) => {
    const backgrounds = globals?.backgrounds ?? {};
    const theme = backgrounds?.value === palettes.dark.background.default ? "dark" : "light";
    return (
      <StyleProvider selectedPalette={theme}>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        ></link>
        <Story />
      </StyleProvider>
    );
  },
];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: palettes.light.background.default,
        },
        {
          name: "dark",
          value: palettes.dark.background.default,
        },
      ],
    },
  },
};

export default preview;
