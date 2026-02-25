import React from "react";

import Icon from "../../asorted/Icon";
import FlexBox from "../../layout/Flex";
import Notification, { Props } from "./index";

export default {
  title: "Messages/Notifications",
  component: Notification,
  argTypes: {
    title: {
      type: "string",
    },
    description: {
      type: "string",
    },
    link: {
      type: "string",
    },
    active: {
      type: "boolean",
    },
    badge: {
      control: false,
    },
    theme: { table: { disable: true } },
    as: { table: { disable: true } },
    forwardedAs: { table: { disable: true } },
  },
  args: {
    title: "Informational title",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nibh felis, pom id...",
    link: "Learn more",
    active: false,
  },
};

export function Notifications(args: Props & { active: boolean }): JSX.Element {
  const { description, link, ...props } = args;

  const warningBadge = (
    <Notification.Badge
      color="warning.c50"
      backgroundColor="warning.c10"
      icon={<Icon name="Warning" size={24} />}
      active={args.active}
    />
  );

  const infoBadge = (
    <Notification.Badge
      color="primary.c100"
      backgroundColor="primary.c10"
      icon={<Icon name="Info" size={24} weight="Medium" />}
      active={args.active}
    />
  );

  return (
    <FlexBox flexDirection="column" rowGap={5}>
      <Notification {...props} badge={warningBadge} hasBackground />
      <Notification {...props} badge={infoBadge} />
      <Notification {...props} description={description} badge={warningBadge} hasBackground />
      <Notification {...props} description={description} badge={infoBadge} />
      <Notification
        description={description}
        link={link}
        {...props}
        badge={warningBadge}
        hasBackground
      />
      <Notification {...props} description={description} link={link} badge={infoBadge} />
    </FlexBox>
  );
}
