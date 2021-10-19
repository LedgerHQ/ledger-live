import { storiesOf } from "@storybook/react-native";
import { boolean, number, withKnobs } from "@storybook/addon-knobs";
import React, { useState } from "react";
import CenterView from "../../CenterView";
import Slider from "@components/Form/Slider";
import FlexBox from "@components/Layout/Flex";

const SliderStory = () => {
  const [value, setValue] = useState(35);

  const onChange = (value) => setValue(value);

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

storiesOf("Form", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Slider", () => <SliderStory />);
