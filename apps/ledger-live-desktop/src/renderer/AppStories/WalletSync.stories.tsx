import { MockProviderDecorator } from "./__mocks__/providers/MockAppProviders";
import Default from "../Default";

export default {
  component: Default,
  title: "App/WalletSync",
  tags: ["!autodocs"],
  decorators: [MockProviderDecorator],
  parameters: {},
};

export const Initialize = {};
