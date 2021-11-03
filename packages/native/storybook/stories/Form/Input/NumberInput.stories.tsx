import { storiesOf } from "../../storiesOf";
import React from "react";
import NumberInput from "../../../../src/components/Form/Input/NumberInput";
import { number } from "@storybook/addon-knobs";

const NumberInputStory = () => {
  const [value, setValue] = React.useState(24.42);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const max = number("max", undefined as any);
  const min = number("min", undefined as any);
  /* esline-enable @typescript-eslint/no-explicit-any */

  // FixMe: Naive implementation, only for story demo
  const onChange = (value: string) => {
    let nb = parseInt(value);
    if (nb) {
      if (max && nb > max) nb = max;
      if (min && nb < min) nb = min;
    }
    setValue(nb);
  };

  const onPercentClick = (percent: number) => {
    setValue(max * percent);
  };

  return (
    <NumberInput
      value={value.toString()}
      onChangeText={onChange}
      onPercentClick={onPercentClick}
      placeholder={"Placeholder"}
      min={min}
      max={max}
    />
  );
};

storiesOf((story) =>
  story("Form/Input", module).add("NumberInput", NumberInputStory)
);
