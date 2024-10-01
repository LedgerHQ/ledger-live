import * as braze from "@braze/web-sdk";
import React from "react";
import { Props, StakeModal } from "./StakeFlowModal";
import StakeFlowModal_deprecated from "./StakeFlowModal_deprecated";

export default function StakeModalVersionWrapper(props: Props) {
  const flag = braze.getFeatureFlag("earn-use-latest-stake-modal");
  braze.logFeatureFlagImpression("earn-use-latest-stake-modal");
  return flag.enabled ? <StakeModal {...props} /> : <StakeFlowModal_deprecated {...props} />;
}
