import React from "react";
import { ComponentStory } from "@storybook/react-native";
import Stepper from "../../../../src/components/Navigation/Stepper";

export default {
  title: "Navigation/Stepper",
  component: Stepper,
};

export const Default: ComponentStory<typeof Stepper> = (args: typeof DefaultArgs) => (
  <Stepper {...args} />
);
const DefaultArgs = {
  steps: ["First step", "Second step", "Third step", "Fourth step"],
  activeIndex: 0,
  errored: false,
};
Default.args = DefaultArgs;
