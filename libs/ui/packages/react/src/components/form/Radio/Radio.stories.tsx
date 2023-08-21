import React from "react";
// @ts-expect-error Typings…
import { useArgs } from "@storybook/client-api";

import Radio from "./index";
import type { RadioProps } from "./index";
import { StoryTemplate } from "./../../helpers";

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

const TemplateElement = (args: RadioProps) => {
  const [currentArgs, updateArgs] = useArgs();
  const handleChange: RadioProps["onChange"] = value => {
    // toggle the checked value on click to simulate onChange
    updateArgs({ currentValue: value });
    // trigger the storybook action
    currentArgs.onChange(value);
  };

  return (
    <Radio
      {...args}
      onChange={handleChange}
      containerProps={{ flexDirection: "column", rowGap: "1rem" }}
    >
      <Radio.Element label="Blue squad" value="blue" variant="default" />
      <Radio.Element label="Black squad" value="black" variant="main" />
      <Radio.Element label="Yellow squad" value="yellow" variant="success" />
      <Radio.Element label="Core squad" value="core" variant="error" />
      <Radio.Element label="Orange squad" value="orange" variant="default" disabled />
      <Radio.Element label="Purple squad" value="purple" variant="default" disabled />
    </Radio>
  );
};

const TemplateOutlinedElement = (args: RadioProps) => {
  const [currentArgs, updateArgs] = useArgs();
  const handleChange: RadioProps["onChange"] = value => {
    // toggle the checked value on click to simulate onChange
    updateArgs({ currentValue: value });
    // trigger the storybook action
    currentArgs.onChange(value);
  };

  return (
    <Radio
      {...args}
      onChange={handleChange}
      containerProps={{ flexDirection: "column", rowGap: "20px" }}
    >
      <Radio.Element outlined label="Black squad" value="black" variant="main" />
      <Radio.Element outlined label="Yellow squad" value="yellow" variant="success" />
      <Radio.Element outlined label="Core squad" value="core" variant="error" />
    </Radio>
  );
};

export const RadioGroup: StoryTemplate<RadioProps> = TemplateElement.bind({
  currentValue: "purple",
});

export const RadioGroupOutlined: StoryTemplate<RadioProps> = TemplateOutlinedElement.bind({});

const TemplateListElement = (args: RadioProps) => {
  const [currentArgs, updateArgs] = useArgs();
  const handleChange: RadioProps["onChange"] = value => {
    // toggle the checked value on click to simulate onChange
    updateArgs({ currentValue: value });
    // trigger the storybook action
    currentArgs.onChange(value);
  };
  return (
    <Radio
      {...args}
      onChange={handleChange}
      containerProps={{ flexDirection: "column", rowGap: "1rem" }}
    >
      <Radio.ListElement
        label="Ledger Verse"
        value="ledgerVerse"
        disabled
        containerProps={{ flex: 1 }}
      />
      <Radio.ListElement label="Live Monad" value="liveMonad" containerProps={{ flex: 1 }} />
      <Radio.ListElement label="Live Hub" value="liveHub" containerProps={{ flex: 1 }} />
      <Radio.ListElement label="Live Meta" value="liveMeta" containerProps={{ flex: 1 }} />
    </Radio>
  );
};

export const RadioGroupList: StoryTemplate<RadioProps> = TemplateListElement.bind({});

// Set the disabled item to be checked on mount
RadioGroup.args = { currentValue: "purple" };
RadioGroupList.args = { currentValue: "liveHub" };
