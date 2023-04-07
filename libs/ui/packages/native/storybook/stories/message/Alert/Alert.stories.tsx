import React from "react";
import { Alert, Flex } from "../../../../src/components";

export default {
  title: "Messages/Alert",
  component: Alert,
  argTypes: {
    type: {
      options: ["info", "warning", "error", undefined],
      control: { type: "select" },
    },
  },
};

export const AlertSample = (args: typeof AlertSampleArgs) => (
  <Flex p={20} width={1}>
    <Alert type={args.type} title={args.title} showIcon={args.showIcon} />
  </Flex>
);
AlertSample.storyName = "Alert";
const AlertSampleArgs = {
  type: undefined,
  title: "Label",
  showIcon: true,
};
AlertSample.args = AlertSampleArgs;
