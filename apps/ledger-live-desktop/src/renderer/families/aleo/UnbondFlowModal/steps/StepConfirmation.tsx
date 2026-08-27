import { createStepConfirmation } from "../../shared/StepConfirmation";

const { StepConfirmation, StepConfirmationFooter } = createStepConfirmation({
  flow: "unbond",
  action: "unbonding",
  trackField: "staker",
});

export { StepConfirmationFooter };
export default StepConfirmation;
