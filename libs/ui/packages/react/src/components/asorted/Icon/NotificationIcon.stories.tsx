import type { Meta, StoryObj } from "@storybook/react";

import * as Icons from "@ledgerhq/icons-ui/react";
import NotificationIcon from "./NotificationIcon";

const meta: Meta<typeof NotificationIcon> = {
  title: "Asorted/NotificationIcon",
  component: NotificationIcon,
  argTypes: {
    icon: {
      description: "Icon to display.",
      options: Object.keys(Icons),
      control: { type: "select" },
    },
    variant: {
      options: ["round", "square"],
      control: { type: "inline-radio" },
    },
  },
  args: {
    icon: "Info",
    variant: "round",
  },
};
export default meta;

type Story = StoryObj<typeof NotificationIcon>;

export const Default: Story = {};
