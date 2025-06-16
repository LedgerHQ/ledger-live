import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { Icons } from "../../../../assets";
import { Link } from "../../../cta";
import NotificationCard from ".";

const meta: Meta<typeof NotificationCard> = {
  title: "Layout/Banner/NotificationCard",
  component: NotificationCard,
  argTypes: {
    title: {
      description: "Title of the card.",
    },
    cta: {
      description: "Call to action element.",
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
    cta: <Link alignSelf="start">Start my free trial</Link>,
    icon: "Warning",
    isHighlighted: false,
  },
};
export default meta;

type Story = StoryObj<typeof NotificationCard>;

export const Default: Story = {};

export const LNSNotificationCard: Story = {
  args: {
    title: "",
    description:
      "Upgrade your Nano S to a newer Ledger — like the Ledger Flex — for more memory, the latest security enhancements, fresh features, and an exclusive 20% off. ",
    cta: (
      <Link alignSelf="start" color="primary.c80">
        Upgrade my Ledger
        <Icons.ExternalLink size="S" style={{ marginLeft: "8px", verticalAlign: "middle" }} />
      </Link>
    ),
    icon: "SparksFill",
    isHighlighted: true,
  },
};
