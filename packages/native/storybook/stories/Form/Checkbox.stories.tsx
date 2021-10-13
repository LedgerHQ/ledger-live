import { storiesOf } from "@storybook/react-native";
import { withKnobs, boolean, text } from "@storybook/addon-knobs";

import React, { useState } from "react";
import Checkbox from "@components/Form/Checkbox";
import CenterView from "../CenterView";

const CheckboxStory = () => {
  const [checked, setChecked] = useState(false);

  const handleChange = () => setChecked((prev) => !prev);

  return (
    <Checkbox
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
  .add("Checkbox", () => <CheckboxStory />);
