import React, { forwardRef } from "react";
import { useSelector } from "react-redux";
import { Flow, hodlShieldFlowSelector } from "~/renderer/reducers/hodlShield";
import HodlShieldActivation from "./Activation";

export interface BackRef {
  goBack: () => void;
}

export interface BackProps {}

export const HodlShieldRouter = forwardRef<BackRef, {}>((props, ref) => {
  // useInitMemberCredentials();
  const flow = useSelector(hodlShieldFlowSelector);
  console.log("Selected Hodl Shield flow", flow);

  switch (flow) {
    default:
    case Flow.Activation:
      return <HodlShieldActivation ref={ref} />;
  }
});

HodlShieldRouter.displayName = "HodlShieldRouter";
