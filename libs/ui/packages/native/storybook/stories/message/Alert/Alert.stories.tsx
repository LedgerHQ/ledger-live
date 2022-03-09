import React from "react";
import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../../storiesOf";
import { select, boolean } from "@storybook/addon-knobs";
import { Alert, Flex } from "../../../../src/";

const AlertSample = () => (
  <Flex p={20} width={1}>
    <Alert
      type={select("type", ["info", "warning", "error", undefined], undefined)}
      title={text("title", "Label")}
      showIcon={boolean("showIcon", true)}
    />
  </Flex>
);

storiesOf((story) => story("Messages", module).add("Alert", AlertSample));
