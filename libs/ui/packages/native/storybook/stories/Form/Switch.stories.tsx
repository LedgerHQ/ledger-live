import React, { useState } from "react";
import Switch from "../../../src/components/Form/Switch";

export default {
  title: "Form/Switch",
  component: Switch,
};

export const SwitchStory = (args: typeof SwitchStoryArgs) => {
  const [checked, setChecked] = useState(false);

  const handleChange = () => setChecked((prev) => !prev);

  return (
    <Switch checked={checked} onChange={handleChange} disabled={args.disabled} label={args.label} />
  );
};
SwitchStory.storyName = "SwitchStory";
const SwitchStoryArgs = {
  disabled: false,
  label: "Label",
};
SwitchStory.args = SwitchStoryArgs;
