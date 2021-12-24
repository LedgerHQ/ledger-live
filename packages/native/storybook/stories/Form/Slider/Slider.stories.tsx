import React, { useState } from "react";
import { storiesOf } from "../../storiesOf";
import { boolean, number } from "@storybook/addon-knobs";
import Slider from "../../../../src/components/Form/Slider";
import FlexBox from "../../../../src/components/Layout/Flex";

const SliderStory = () => {
  const [value, setValue] = useState(35);

  const onChange = (value: number) => setValue(value);

  return (
    <FlexBox p={20} width={1}>
      <Slider
        value={value}
        onChange={onChange}
        disabled={boolean("disabled", false)}
        min={number("min", 0, { min: 0, max: 10000000 })}
        max={number("max", 100, { min: 0, max: 10000000 })}
        step={number("step", 1, { min: 0, max: 10000000 })}
      />
    </FlexBox>
  );
};

storiesOf((story) => story("Form", module).add("Slider", () => <SliderStory />));
