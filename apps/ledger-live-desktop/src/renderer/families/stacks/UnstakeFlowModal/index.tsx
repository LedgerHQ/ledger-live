import React from "react";
import StacksFlowModal from "../StacksFlowModal";
import Body from "./Body";

const UnstakeFlowModal = () => (
  <StacksFlowModal name="MODAL_STACKS_UNSTAKE" initialStepId="connectDevice" Body={Body} />
);

export default UnstakeFlowModal;
