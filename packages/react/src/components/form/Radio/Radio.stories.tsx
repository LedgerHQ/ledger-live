import React from "react";
import { useArgs } from "@storybook/client-api";

import Radio from "./index";
import type { RadioProps } from "./index";

export default {
  title: "Form/Radio",
  argTypes: {
    currentValue: {
      type: "text",
      description:
        "This is the current value. A RadioItem will be checked if its value matches this value.",
      control: false,
    },
    name: {
      type: "text",
      description: "The name property is used to link all RadioItems",
      control: false,
    },
    onChange: {
      control: false,
      description: "The callback receives the value of the pressed RadioItem as parameter",
      action: "clicked",
    },
  },
};

const Template = (args: RadioProps) => {
  const [currentArgs, updateArgs] = useArgs();

  const handleChange: RadioProps["onChange"] = (value) => {
    // toggle the checked value on click to simulate onChange
    updateArgs({ currentValue: value });

    // trigger the storybook action
    currentArgs.onChange(value);
  };

  return (
    <Radio {...args} onChange={handleChange}>
      <Radio.Element label="Blue squad" value="blue" variant="default" />
      <Radio.Element label="Yellow squad" value="yellow" variant="success" />
      <Radio.Element label="Core squad" value="core" variant="error" />
      <Radio.Element label="Orange squad" value="orange" variant="default" disabled />
    </Radio>
  );
};

export const RadioGroup = Template.bind({});
