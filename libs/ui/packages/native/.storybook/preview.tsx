import React from "react";

import { palettes } from "@ledgerhq/ui-shared";
import CenterView from "../storybook/stories/CenterView";
import type { Preview } from "@storybook/react";

export const decorators = [
  // withBackgrounds,
  (Story, { globals }) => {
    return (
      <CenterView waitFonts={true}>
        <Story />
      </CenterView>
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
  options: {
    storySort: (a, b) =>
      a[1].kind === b[1].kind ? 0 : a[1].id.localeCompare(b[1].id, undefined, { numeric: true }),
  },
};

const preview: Preview = {
  decorators,
  parameters,
};

export default preview;
