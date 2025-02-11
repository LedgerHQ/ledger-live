import type { Meta, StoryObj } from "@storybook/react";

import { Icons } from "../../../../assets";
import NotificationCard, { NotificationCardProps } from ".";

export default {
  title: "Layout/Banner/NotificationCard",
  component: NotificationCard,
  argTypes: {
    title: {
      description: "Title of the card.",
    },
    cta: {
      description: "Call to action text.",
    },
    description: {
      description: "Description of the card.",
    },
    icon: {
      description: "Icon to be displayed on the left of the notification card.",
      options: Object.keys(Icons),
      control: {
        type: "select",
      },
    },
    onClick: {
      description: "Function to be called when the card is clicked.",
    },
  },
  args: {
    title: "Ledger Recover",
    description: "Get peace of mind and start your free trial.",
    cta: "Start my free trial",
    icon: "Warning",
    isHighlighted: false,
  },
} satisfies Meta<NotificationCardProps>;

export const Default: StoryObj<NotificationCardProps> = {};

export const LNSNotificationCard: StoryObj<NotificationCardProps> = {
  args: {
    title: undefined,
    description: "Updates are ending soon. Upgrade now with 20% off for a seamless experience.",
    cta: "Level up my wallet",
    icon: "SparksFill",
    isHighlighted: true,
  },
};
