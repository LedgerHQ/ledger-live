import React from "react";
import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../../storiesOf";
import { Log, Flex } from "../../../../src/";

const LogSample = () => {
  return (
    <Flex>
      <Log>{text("children text", "some text")}</Log>
    </Flex>
  );
};

storiesOf((story) => story("Messages", module).add("Log", LogSample));
