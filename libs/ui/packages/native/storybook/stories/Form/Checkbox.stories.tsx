import React, { useState } from "react";
import Checkbox from "../../../src/components/Form/Checkbox";

export default {
  title: "Form/Checkbox",
  component: Checkbox,
};

export const CheckboxStory = (args: typeof CheckboxStoryArgs) => {
  const [checked, setChecked] = useState(false);

  const handleChange = () => setChecked((prev) => !prev);

  return (
    <Checkbox
      checked={checked}
      onChange={handleChange}
      disabled={args.disabled}
      label={args.label}
    />
  );
};
CheckboxStory.storyName = "Checkbox";
const CheckboxStoryArgs = {
  disabled: false,
  label: "Label",
};
CheckboxStory.args = CheckboxStoryArgs;
