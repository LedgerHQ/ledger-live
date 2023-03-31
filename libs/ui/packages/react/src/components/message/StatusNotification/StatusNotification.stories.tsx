import React from "react";

import Icon from "../../asorted/Icon";
import FlexBox from "../../layout/Flex";
import StatusNotification, { Props } from "./index";

export default {
  title: "Messages/Status Notifications",
  component: StatusNotification,
  argTypes: {
    text: {
      type: "string",
      defaultValue: "Ledger Live is Experiencing Issues",
    },
    badge: {
      control: false,
    },
    columnGap: { control: false },
    rowGap: { control: false },
    hasBorder: { type: "boolean" },
    theme: { table: { disable: true } },
    as: { table: { disable: true } },
    forwardedAs: { table: { disable: true } },
  },
};

export function StatusNotifications(args: Props & { active: boolean }): JSX.Element {
  const { ...props } = args;

  const warningBadge = <Icon name="Warning" size={50} color="error.c100" weight="Medium" />;
  const infoBadge = <Icon name="Info" size={50} color="primary.c100" weight="Medium" />;

  return (
    <FlexBox justifyContent="center">
      <FlexBox width="502px" flexDirection="column" rowGap={5}>
        <StatusNotification {...props} badge={warningBadge} hasBorder />
        <StatusNotification {...props} badge={infoBadge} />
        <StatusNotification {...props} badge={warningBadge} hasBorder />
        <StatusNotification {...props} badge={infoBadge} />
      </FlexBox>
    </FlexBox>
  );
}
