import React from "react";
import Icon from "@components/asorted/Icon";
import FlexBox from "@components/layout/Flex";
import Notification, { Props } from "./index";

export default {
  title: "Messages/Notifications",
  component: Notification,
  argTypes: {
    title: {
      type: "string",
      defaultValue: "Informational title",
    },
    description: {
      type: "string",
      defaultValue:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
    },
    link: {
      type: "string",
      defaultValue: "Learn more",
    },
    active: {
      type: "boolean",
      defaultValue: false,
    },
    badge: {
      control: false,
    },
    theme: { table: { disable: true } },
    as: { table: { disable: true } },
    forwardedAs: { table: { disable: true } },
  },
};

export function Notifications(args: Props & { active: boolean }): JSX.Element {
  const { description, link, ...props } = args;

  const warningBadge = (
    <Notification.Badge
      color="palette.warning.c100"
      backgroundColor="palette.warning.c10"
      icon={<Icon name="Warning" size={24} />}
      active={args.active}
    />
  );

  const infoBadge = (
    <Notification.Badge
      color="palette.primary.c100"
      backgroundColor="palette.primary.c10"
      icon={<Icon name="Info" size={24} weight="Medium" />}
      active={args.active}
    />
  );

  return (
    <FlexBox flexDirection="column" rowGap={5}>
      <Notification {...props} backgroundColor="palette.neutral.c30" badge={warningBadge} />
      <Notification {...props} backgroundColor="palette.primary.c10" badge={infoBadge} />
      <Notification
        {...props}
        backgroundColor="palette.neutral.c30"
        description={description}
        badge={warningBadge}
      />
      <Notification
        {...props}
        backgroundColor="palette.primary.c10"
        description={description}
        badge={infoBadge}
      />
      <Notification
        backgroundColor="palette.neutral.c30"
        description={description}
        link={link}
        {...props}
        badge={warningBadge}
      />
      <Notification
        {...props}
        backgroundColor="palette.primary.c10"
        description={description}
        link={link}
        badge={infoBadge}
      />
    </FlexBox>
  );
}
