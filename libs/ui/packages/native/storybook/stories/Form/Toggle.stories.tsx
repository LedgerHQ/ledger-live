import React from "react";
import Toggle from "../../../src/components/Form/Toggle";

export default {
  title: "Form/Toggle",
  component: Toggle,
};

export const Default = (args: typeof DefaultArgs) => (
  <Toggle active={args.active} onPress={() => {}}>
    {args.text}
  </Toggle>
);
Default.storyName = "Toggle";
const DefaultArgs = {
  active: false,
  text: "Toggle",
};
Default.args = DefaultArgs;
