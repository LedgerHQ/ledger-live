import React from "react";
import StacksFlowModal from "../StacksFlowModal";
import Body from "./Body";

const StakeFlowModal = () => (
  <StacksFlowModal name="MODAL_STACKS_STAKE" initialStepId="validator" Body={Body} />
);

export default StakeFlowModal;
