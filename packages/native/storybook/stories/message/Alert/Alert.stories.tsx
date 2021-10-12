import React from "react";
import { text } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import Alert from "@components/message/Alert";
import CenterView from "../../CenterView";
import FlexBox from "@components/Layout/Flex";

storiesOf("Messages", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Alert", () => (
    <FlexBox p={20} width={1}>
      <Alert
        type={select(
          "type",
          ["info", "warning", "error", undefined],
          undefined
        )}
        title={text("title", "Label")}
        showIcon={boolean("showIcon", true)}
      />
    </FlexBox>
  ));
