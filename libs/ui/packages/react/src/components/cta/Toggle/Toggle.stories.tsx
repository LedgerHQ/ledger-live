import React from "react";
// @ts-expect-error Typings…
import { useArgs } from "@storybook/client-api";

import Toggle from "./index";
import type { ToggleProps } from "./index";
import { StoryTemplate } from "./../../helpers";

export default {
  title: "cta/Toggle",
  component: Toggle,
  argTypes: {
    checked: {
      type: "boolean",
      description: "Control if the component is checked or not",
      required: true,
      control: { type: "boolean" },
    },
  },
  parameters: { controls: { exclude: /^(?!.*(checked))/ } },
};

const Template = (args: ToggleProps) => {
  const [currentArgs, updateArgs] = useArgs();

  const handleClick = () => updateArgs({ checked: !currentArgs.checked });

  return (
    <Toggle {...args} onClick={handleClick}>
      {args.children}
    </Toggle>
  );
};

export const Default: StoryTemplate<ToggleProps> = Template.bind({});
Default.args = {
  children: "Max",
  checked: true,
};
