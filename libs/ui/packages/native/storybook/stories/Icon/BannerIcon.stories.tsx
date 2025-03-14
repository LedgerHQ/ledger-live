import type { Meta, StoryObj } from "@storybook/react-native";
import * as Icons from "@ledgerhq/icons-ui/native";
import BannerIcon from "../../../src/components/Icon/BannerIcon";

const meta: Meta<typeof BannerIcon> = {
  title: "Icon/BannerIcon",
  component: BannerIcon,
  argTypes: {
    icon: {
      description: "Icon to display.",
      options: Object.keys(Icons),
      control: { type: "select" },
    },
  },
  args: {
    icon: "Information",
  },
};
export default meta;

export const Default: StoryObj<typeof BannerIcon> = {
  name: "BannerIcon",
};
