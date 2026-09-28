import { createStepConfirmation } from "../../shared/StepConfirmation";

const { StepConfirmation, StepConfirmationFooter } = createStepConfirmation({
  flow: "unbond",
  trackField: "staker",
});

export { StepConfirmationFooter };
export default StepConfirmation;
