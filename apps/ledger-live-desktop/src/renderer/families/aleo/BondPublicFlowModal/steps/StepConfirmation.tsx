import { createStepConfirmation } from "../../shared/StepConfirmation";

const { StepConfirmation, StepConfirmationFooter } = createStepConfirmation({
  flow: "bond",
  action: "bonding",
  trackField: "validator",
});

export { StepConfirmationFooter };
export default StepConfirmation;
