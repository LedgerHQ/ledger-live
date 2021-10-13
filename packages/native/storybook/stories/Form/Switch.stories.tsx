import { storiesOf } from "@storybook/react-native";
import { withKnobs, boolean, text } from "@storybook/addon-knobs";

import React, { useState } from "react";
import Switch from "@components/Form/Switch";
import CenterView from "../CenterView";

const SwitchStory = () => {
  const [checked, setChecked] = useState(false);

  const handleChange = () => setChecked((prev) => !prev);

  return (
    <Switch
      checked={checked}
      onChange={handleChange}
      disabled={boolean("disabled", false)}
      label={text("label", "Label")}
    />
  );
};

storiesOf("Form", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Switch", () => <SwitchStory />);
