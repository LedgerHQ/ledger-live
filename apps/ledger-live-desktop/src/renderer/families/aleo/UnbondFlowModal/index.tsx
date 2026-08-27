import Body from "./Body";
import { StepId } from "./types";
import { createStakingFlowModal } from "../shared/createStakingFlowModal";

export default createStakingFlowModal<"MODAL_ALEO_UNBOND", StepId>({
  name: "MODAL_ALEO_UNBOND",
  initialStepId: "amount",
  Body,
});
