import { storiesOf } from "@storybook/react-native";
import { number, select, text, withKnobs } from "@storybook/addon-knobs";
import React from "react";
import Info from "../../../src/assets/icons/InfoMedium";
import CenterView from "../CenterView";
import Notification from "@components/drawer/Notification";
import { action } from "@storybook/addon-actions";
import FlexBox from "@components/Layout/Flex";

storiesOf("Layout", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Drawer/Notification", () => (
    <FlexBox p={20}>
      <Notification
        Icon={Info}
        variant={select("variant", ["primary", "secondary"], "primary")}
        title={text(
          "title",
          "Title about Security information which could be on 2 lines maximum"
        )}
        numberOfLines={number("numberOfLines", 9, { min: 1, max: 10 })}
        onClose={action("onClose")}
      />
    </FlexBox>
  ))
  .add("Drawer/Notification/News", () => (
    <FlexBox p={20}>
      <Notification
        Icon={Info}
        variant={select("variant", ["primary", "secondary"], "primary")}
        title={text("title", "Status")}
        subtitle={text("subtitle", "Message")}
        numberOfLines={number("numberOfLines", 9, { min: 1, max: 10 })}
        onLearnMore={action("onLearnMore")}
      />
    </FlexBox>
  ));
