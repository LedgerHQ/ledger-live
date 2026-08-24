import Body from "./Body";
import { StepId } from "./types";
import { createStakingFlowModal } from "../shared/createStakingFlowModal";

export default createStakingFlowModal<"MODAL_ALEO_BOND_PUBLIC", StepId>({
  name: "MODAL_ALEO_BOND_PUBLIC",
  initialStepId: "validator",
  Body,
});
