import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react-native";
import NotificationCard from "../../../src/components/Cards/NotificationCard";
import Flex from "../../../src/components/Layout/Flex";
import { descriptionNotificationCard } from "./descriptionsCards";

export default {
  title: "Cards",
  component: NotificationCard,
  parameters: {
    docs: {
      description: {
        component: descriptionNotificationCard,
      },
    },
  },
} as ComponentMeta<typeof NotificationCard>;

export const NotificationCardStory: ComponentStory<typeof NotificationCard> = (
  args: typeof NotificationCardStoryArgs,
) => {
  return (
    <Flex
      width="100%"
      height="300px"
      backgroundColor="neutral.c20"
      alignItems="center"
      justifyContent="center"
      p="16px"
    >
      <NotificationCard
        tag={args.tag}
        description={args.description}
        cta={args.cta}
        time={args.time}
        title={args.title}
        showLinkCta={args.hasLink}
        onClickCard={() => {}}
        viewed={args.viewed}
      />
    </Flex>
  );
};
NotificationCardStory.storyName = "NotificationCard";
const NotificationCardStoryArgs = {
  tag: "Promo",
  viewed: false,
  title: "Free shipping worldwide for 1 week only",
  description:
    "Free shipping for all Ledger Nano products is available until 17th of October. Act fast and get your Nano now.",
  cta: "Link",
  time: "2 minutes ago",
  hasLink: true,
};
NotificationCardStory.args = NotificationCardStoryArgs;
