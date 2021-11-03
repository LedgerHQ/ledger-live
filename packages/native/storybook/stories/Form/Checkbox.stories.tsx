import React, { useState } from "react";
import { storiesOf } from "../storiesOf";
import { boolean, text } from "@storybook/addon-knobs";

import Checkbox from "../../../src/components/Form/Checkbox";

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

storiesOf((story) => story("Form", module).add("Checkbox", CheckboxStory));
