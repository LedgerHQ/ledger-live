import * as braze from "@braze/web-sdk";
import React from "react";
import { Props, StakeModal } from "./StakeFlowModal";
import StakeFlowModal_deprecated from "./StakeFlowModal_deprecated";

export default function StakeModalVersionWrapper(props: Props) {
  return braze.getFeatureFlag("earn-use-latest-stake-modal").enabled ? (
    <StakeModal {...props} />
  ) : (
    <StakeFlowModal_deprecated {...props} />
  );
}
