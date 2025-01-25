import React from "react";
import { Props, StakeModal } from "./StakeFlowModal";
import StakeFlowModal_deprecated from "./StakeFlowModal_deprecated";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export default function StakeModalVersionWrapper(props: Props) {
  const ethStakingModalWithFilters = useFeature("ethStakingModalWithFilters");
  return ethStakingModalWithFilters?.enabled ? (
    <StakeModal {...props} />
  ) : (
    <StakeFlowModal_deprecated {...props} />
  );
}
