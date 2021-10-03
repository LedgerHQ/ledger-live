import { storiesOf } from "@storybook/react-native";
import { withKnobs } from "@storybook/addon-knobs";
import React from "react";
import CenterView from "../../CenterView";
import { InputProps } from "../../../../src/components/Form/Input/BaseInput";
import NumberInput from "../../../../src/components/Form/Input/NumberInput";

const NumberInputStory = ({
  min = 0,
  max = 349,
  ...otherArgs
}: InputProps & { max: number; min: number }): JSX.Element => {
  const [value, setValue] = React.useState(24.42);

  // FixMe: Naive implementation, only for story demo
  const onChange = (value) => {
    if (value) {
      value = parseFloat(value);
      if (value > max) value = max;
      if (value < min) value = min;
      value = value.toString();
    }
    setValue(value);
  };

  const onPercentClick = (percent) => {
    setValue((max * percent).toString());
  };

  return (
    <NumberInput
      {...otherArgs}
      value={value}
      onChangeText={onChange}
      onPercentClick={onPercentClick}
      placeholder={"Placeholder"}
      max={max}
      min={min}
    />
  );
};

storiesOf("Form", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Input/NumberInput", () => <NumberInputStory />);
