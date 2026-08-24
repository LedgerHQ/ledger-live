import { createStepConfirmation } from "../../shared/StepConfirmation";

const { StepConfirmation, StepConfirmationFooter } = createStepConfirmation({
  flow: "claim",
  action: "claiming",
  trackField: "staker",
});

export { StepConfirmationFooter };
export default StepConfirmation;
