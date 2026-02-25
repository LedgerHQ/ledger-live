import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { IconsLegacy } from "../../../../src/assets";
import Notification from "../../../../src/components/message/Notification";
import FlexBox from "../../../../src/components/Layout/Flex";

type NotificationStoryArgs = React.ComponentProps<typeof Notification> & {
  showIcon?: boolean;
};

const meta = {
  title: "Messages/Notification",
  component: Notification,
  argTypes: {
    variant: {
      options: ["primary", "secondary", "success", "error", "warning", "neutral", "plain"],
      control: { type: "select" },
    },
  },
} satisfies Meta<NotificationStoryArgs>;

export default meta;

type Story = StoryObj<NotificationStoryArgs>;

const baseRender = (args: NotificationStoryArgs) => {
  const { showIcon, ...notificationArgs } = args;
  return (
    <FlexBox p={20} width="100%">
      <Notification {...notificationArgs} Icon={showIcon ? IconsLegacy.InfoMedium : undefined} />
    </FlexBox>
  );
};

export const NotificationSample: Story = {
  name: "Notification",
  args: {
    showIcon: true,
    variant: "primary",
    title: "Title about Security information which could be on 2 lines maximum",
    numberOfLines: 9,
    onClose: () => {},
  },
  render: baseRender,
};

export const NotificationNews: Story = {
  name: "News",
  args: {
    showIcon: true,
    variant: "primary",
    title: "Status",
    subtitle: "Message",
    numberOfLines: 9,
    linkText: "Learn more",
    iconColor: "",
    onLinkPress: () => {},
  },
  render: baseRender,
};
