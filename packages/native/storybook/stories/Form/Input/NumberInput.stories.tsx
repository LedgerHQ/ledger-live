import { storiesOf } from "../../storiesOf";
import React from "react";
import NumberInput from "../../../../src/components/Form/Input/NumberInput";
import { number } from "@storybook/addon-knobs";

const NumberInputStory = () => {
  const [value, setValue] = React.useState(24.42);
  const max = number("max", undefined);
  const min = number("min", undefined)

  // FixMe: Naive implementation, only for story demo
  const onChange = (value) => {
    if (value) {
      if (max && value > max) value = max;
      if (min && value < min) value = min;
    }
    setValue(value);
  };

  const onPercentClick = (percent) => {
    setValue(max * percent);
  };

  return (
    <NumberInput
      value={value.toString()}
      onChangeText={onChange}
      onPercentClick={onPercentClick}
      placeholder={"Placeholder"}
      max={max}
      min={min}
    />
  );
};

storiesOf((story) =>
  story("Form/Input", module).add("NumberInput", NumberInputStory)
);
