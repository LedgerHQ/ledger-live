import { createStepConfirmation } from "../../shared/StepConfirmation";

const { StepConfirmation, StepConfirmationFooter } = createStepConfirmation({
  flow: "bond",
  trackField: "validator",
});

export { StepConfirmationFooter };
export default StepConfirmation;
