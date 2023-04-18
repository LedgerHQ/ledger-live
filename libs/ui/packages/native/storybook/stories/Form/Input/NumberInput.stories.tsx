import React from "react";
import NumberInput from "../../../../src/components/Form/Input/NumberInput";

export default {
  title: "Form/Input/NumberInput",
  component: NumberInput,
};

export const NumberInputStory = (args: typeof NumberInputStoryArgs) => {
  const [value, setValue] = React.useState(24.42);

  const { min, max } = args;

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
NumberInputStory.storyName = "NumberInput";
const NumberInputStoryArgs = {
  min: 0,
  max: 349,
};
NumberInputStory.args = NumberInputStoryArgs;
