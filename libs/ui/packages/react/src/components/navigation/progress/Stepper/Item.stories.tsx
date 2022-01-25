import React from "react";
import { Step, StepProps } from "./index";

export default {
  title: "Navigation/Progress/Stepper/Item",
  component: Step,
};

export const Item = (args: StepProps): JSX.Element => (
  <div style={{ width: "75px" }}>
    <Step {...args} />
  </div>
);
Item.args = {
  state: "current",
  label: "label",
  hideLeftSeparator: true,
  nextState: undefined,
};
