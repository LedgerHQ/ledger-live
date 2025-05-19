import Default from "../Default";
import accounts from "./__mocks__/data/accounts";
import { MockProviderDecorator } from "./__mocks__/providers/MockAppProviders";

export default {
  component: Default,
  title: "App/Portfolio",
  tags: ["!autodocs"],
  decorators: [MockProviderDecorator],
  parameters: {
    state: {
      accounts,
    },
  },
};

export const Portfolio = {};

export const EmptyStateInstalledApps = {
  parameters: {
    state: {
      accounts: [],
      settings: {
        hasInstalledApps: false,
      },
    },
  },
};
