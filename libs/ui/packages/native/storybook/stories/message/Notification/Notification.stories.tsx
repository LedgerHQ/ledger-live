import { storiesOf } from "../../storiesOf";
import { number, select, text, color, boolean } from "@storybook/addon-knobs";
import React from "react";
import { Icons } from "../../../../src/assets";
import Notification from "../../../../src/components/message/Notification";
import { action } from "@storybook/addon-actions";
import FlexBox from "../../../../src/components/Layout/Flex";

const NotificationSample = () => (
  <FlexBox p={20} width={"100%"}>
    <Notification
      Icon={Icons.InfoMedium}
      variant={select("variant", ["primary", "secondary"], "primary")}
      title={text("title", "Title about Security information which could be on 2 lines maximum")}
      numberOfLines={number("numberOfLines", 9, { min: 1, max: 10 })}
      onClose={action("onClose")}
    />
  </FlexBox>
);

const NotificationNews = () => (
  <FlexBox p={20} width={"100%"}>
    <Notification
      Icon={boolean("showIcon", true) ? Icons.InfoMedium : undefined}
      variant={select("variant", ["primary", "secondary"], "primary")}
      title={text("title", "Status")}
      subtitle={text("subtitle", "Message")}
      numberOfLines={number("numberOfLines", 9, { min: 1, max: 10 })}
      linkText={text("linkText", "Learn more")}
      onLinkPress={action("onLinkPress")}
      iconColor={color("iconColor", "")}
    />
  </FlexBox>
);

storiesOf((story) =>
  story("Messages/Notification", module)
    .add("Notification", NotificationSample)
    .add("News", NotificationNews),
);
