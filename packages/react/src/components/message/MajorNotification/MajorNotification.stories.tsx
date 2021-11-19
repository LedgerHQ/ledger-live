import React from "react";

import Icon from "../../asorted/Icon";
import FlexBox from "../../layout/Flex";
import MajorNotification, { Props } from "./index";

export default {
  title: "Messages/Major Notifications",
  component: MajorNotification,
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

export function MajorNotifications(args: Props & { active: boolean }): JSX.Element {
  const { ...props } = args;

  const warningBadge = <Icon name="Warning" size={50} color="palette.error.c100" weight="Light" />;
  const infoBadge = <Icon name="Info" size={50} color="palette.primary.c100" weight="Regular" />;

  return (
    <FlexBox justifyContent="center">
      <FlexBox width="502px" flexDirection="column" rowGap={5}>
        <MajorNotification {...props} badge={warningBadge} hasBorder />
        <MajorNotification {...props} badge={infoBadge} />
        <MajorNotification {...props} badge={warningBadge} hasBorder />
        <MajorNotification {...props} badge={infoBadge} />
      </FlexBox>
    </FlexBox>
  );
}
