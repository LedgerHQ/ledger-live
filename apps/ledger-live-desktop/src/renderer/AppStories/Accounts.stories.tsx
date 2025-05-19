import accounts from "./__mocks__/data/accounts";
import { MockProviderDecorator } from "./__mocks__/providers/MockAppProviders";
import Default from "../Default";

export default {
  component: Default,
  title: "App/Accounts",
  tags: ["!autodocs"],
  decorators: [MockProviderDecorator],
  parameters: {
    path: "/accounts",
    state: {
      accounts,
    },
  },
};

export const Accounts = {};
