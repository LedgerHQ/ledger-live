import { storiesOf } from "../../storiesOf";
import React from "react";
import NumberInput from "../../../../src/components/Form/Input/NumberInput";
import { number } from "@storybook/addon-knobs";

const NumberInputStory = () => {
  const [value, setValue] = React.useState(24.42);
  const max = number("max", 349);
  const min = number("min", 0);

  // FixMe: Naive implementation, only for story demo
  const onChange = (nb?: number) => {
    if (nb) {
      if (max && nb > max) nb = max;
      if (min && nb < min) nb = min;
      setValue(nb);
    }
  };

  const onPercentClick = (percent: number) => {
    setValue(max * percent);
  };

  return (
    <NumberInput
      value={value}
      onChange={onChange}
      onPercentClick={onPercentClick}
      placeholder={"Placeholder"}
      min={min}
      max={max}
    />
  );
};

storiesOf((story) => story("Form/Input", module).add("NumberInput", NumberInputStory));
