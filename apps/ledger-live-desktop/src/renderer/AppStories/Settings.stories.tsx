import { MockProviderDecorator } from "./__mocks__/providers/MockAppProviders";
import Default from "../Default";

export default {
  component: Default,
  title: "App/Settings",
  tags: ["!autodocs"],
  decorators: [MockProviderDecorator],
  parameters: {
    path: "/settings",
  },
};

export const Settings = {};
