import React from "react";
import ProgressSteps, { Props, StepText, StepState } from "./index";

export default {
  title: "Navigation/Progress/Stepper",
  component: ProgressSteps,
  argTypes: {
    activeIndex: {
      control: { type: "number" },
    },
    errored: {
      control: { type: "boolean" },
    },
  },
};

export const Component = (args: Props): JSX.Element => <ProgressSteps {...args} />;
Component.args = {
  steps: [
    "Crypto Asset",
    "Device",
    ({ state }: { state: StepState }) => (
      <StepText variant="small" state={state} textAlign="center">
        Accounts
        <br />
        (step state: {state})
      </StepText>
    ),
    "Confirmation",
  ],
  activeIndex: 0,
  errored: false,
  disabledIndexes: [1],
};
