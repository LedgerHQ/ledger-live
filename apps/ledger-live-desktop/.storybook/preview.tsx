import type { Preview } from "@storybook/react";
import { initialize, mswLoader } from "msw-storybook-addon";
import { appConfig } from "@ledgerhq/live-common/apps/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { palettes } from "@ledgerhq/react-ui/styles/index";
import "./__mocks__/_globals";

LiveConfig.setConfig(appConfig);

{
  // Get the Storybook's own origin
  const storybookOrigin = window.location.origin;

  initialize({
    onUnhandledRequest: (request, print) => {
      if (new URL(request.url).origin === storybookOrigin) return;

      print.warning();
    },
  });
}

const preview: Preview = {
  loaders: [mswLoader],

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
