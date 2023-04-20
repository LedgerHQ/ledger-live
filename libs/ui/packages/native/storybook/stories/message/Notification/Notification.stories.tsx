import React from "react";
import { action } from "@storybook/addon-actions";
import { ComponentStory } from "@storybook/react-native";
import { Icons } from "../../../../src/assets";
import Notification from "../../../../src/components/message/Notification";
import FlexBox from "../../../../src/components/Layout/Flex";

export default {
  title: "Messages/Notification",
  component: Notification,
};

export const NotificationSample: ComponentStory<typeof Notification> = (
  args: typeof NotificationSampleArgs,
) => (
  <FlexBox p={20} width={"100%"}>
    <Notification
      Icon={Icons.InfoMedium}
      variant={args.variant}
      title={args.title}
      numberOfLines={args.numberOfLines}
      onClose={action("onClose")}
    />
  </FlexBox>
);
NotificationSample.storyName = "Notification";
const NotificationSampleArgs = {
  variant: "primary",
  title: "Title about Security information which could be on 2 lines maximum",
  numberOfLines: 9,
};
NotificationSample.args = NotificationSampleArgs;
NotificationSample.argTypes = {
  variant: {
    options: ["primary", "secondary", "success", "error", "warning", "neutral", "plain"],
    control: { type: "select" },
  },
};

export const NotificationNews: ComponentStory<typeof Notification> = (
  args: typeof NotificationNewsArgs,
) => (
  <FlexBox p={20} width={"100%"}>
    <Notification
      Icon={args.showIcon ? Icons.InfoMedium : undefined}
      variant={args.variant}
      title={args.title}
      subtitle={args.subtitle}
      numberOfLines={args.numberOfLines}
      linkText={args.linkText}
      onLinkPress={action("onLinkPress")}
      iconColor={args.iconColor}
    />
  </FlexBox>
);
NotificationNews.storyName = "News";
const NotificationNewsArgs = {
  showIcon: true,
  variant: "primary",
  title: "Status",
  subtitle: "Message",
  numberOfLines: 9,
  linkText: "Learn more",
  iconColor: "",
};
NotificationNews.args = NotificationNewsArgs;
NotificationNews.argTypes = {
  variant: {
    options: ["primary", "secondary", "success", "error", "warning", "neutral", "plain"],
    control: { type: "select" },
  },
};
