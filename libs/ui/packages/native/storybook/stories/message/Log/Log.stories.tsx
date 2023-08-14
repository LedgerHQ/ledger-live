import React from "react";
import { Log, Flex } from "../../../../src/components";

export default {
  title: "Messages/Log",
  component: Log,
};

export const LogSample = (args: typeof LogSampleArgs) => {
  return (
    <Flex>
      <Log>{args.children}</Log>
    </Flex>
  );
};
LogSample.storyName = "Log";
const LogSampleArgs = {
  children: "some text",
};
LogSample.args = LogSampleArgs;
