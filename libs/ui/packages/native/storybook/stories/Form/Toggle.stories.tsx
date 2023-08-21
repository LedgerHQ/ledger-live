import React from "react";
import { action } from "@storybook/addon-actions";
import Toggle from "../../../src/components/Form/Toggle";

export default {
  title: "Form/Toggle",
  component: Toggle,
};

export const Default = (args: typeof DefaultArgs) => (
  <Toggle active={args.active} onPress={action("onPress")}>
    {args.text}
  </Toggle>
);
Default.storyName = "Toggle";
const DefaultArgs = {
  active: false,
  text: "Toggle",
};
Default.args = DefaultArgs;
