import React from "react";
import { useArgs } from "@storybook/manager-api";

import Checkbox from "./index";
import type { CheckboxProps } from "./Checkbox";
import { StoryTemplate } from "../../helpers";

export default {
  title: "Form/SelectionControls/Checkbox",
  component: Checkbox,
  argTypes: {
    isDisabled: {
      type: "boolean",
      description: "Control if the component is disabled or not",
      required: false,
      control: { type: "boolean" },
    },
    isChecked: {
      type: "boolean",
      description: "Control if the component is checked or not",
      required: true,
      control: { type: "boolean" },
    },
    variant: {
      type: "text",
      description: "default | success | error",
      required: false,
      control: false,
    },
    label: {
      type: "text",
      description: "Any valid string",
      required: false,
      control: { type: "text" },
    },
    name: { control: false },
    size: {
      type: "number",
      description: "Size of the checkbox",
      required: false,
      control: { type: "number" },
    },
  },
};

const Template = (args: CheckboxProps) => {
  const [currentArgs, updateArgs] = useArgs();

  const handleChange = () => updateArgs({ isChecked: !currentArgs.isChecked });

  return <Checkbox {...args} onChange={handleChange} />;
};

export const Default: StoryTemplate<CheckboxProps> = Template.bind({});
export const Success: StoryTemplate<CheckboxProps> = Template.bind({});
export const Error: StoryTemplate<CheckboxProps> = Template.bind({});

Default.args = {
  isChecked: false,
  label: "checkbox with label",
  variant: "default",
  name: "default checkbox",
};

Success.args = {
  isChecked: false,
  label: "checkbox with label",
  variant: "success",
  name: "success checkbox",
};

Error.args = {
  isChecked: false,
  label: "checkbox with label",
  variant: "error",
  name: "error checkbox",
};
