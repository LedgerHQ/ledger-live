import { createStepConfirmation } from "../../shared/StepConfirmation";

const { StepConfirmation, StepConfirmationFooter } = createStepConfirmation({
  flow: "claim",
  trackField: "staker",
});

export { StepConfirmationFooter };
export default StepConfirmation;
