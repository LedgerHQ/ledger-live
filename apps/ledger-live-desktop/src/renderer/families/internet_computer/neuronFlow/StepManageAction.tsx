import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import MissingNeuron from "../ManageNeuronFlowModal/steps/MissingNeuron";
import { neuronHasGone, reportableObjection } from "./submitGate";
import type { StepId, StepProps } from "./types";

// GenericStepConnectDevice is typed against the generated union of every family's Transaction; the
// flow narrows it to the ICP one, which the union does not track.
const ConnectDevice = GenericStepConnectDevice as unknown as React.ComponentType<StepProps>;

type Props = StepProps & {
  /** Where Back leads once the action is refused — the manage card, or the list in flows without one. */
  backTo: StepId;
};

/**
 * The device step for an action on one neuron, which checks the bridge before the device does.
 *
 * The steps that collect input are already stopped by their footer, but the actions that go straight
 * from a button to the device answer to nothing — and either kind can have its neuron change between
 * the screen that offered the action and this one. Without this the refusal arrives from the
 * canister, one device confirmation later.
 */
const StepManageAction = ({ backTo, ...props }: Props) => {
  const objection = reportableObjection(props);

  if (neuronHasGone(props)) return <MissingNeuron {...props} />;
  if (!objection) return <ConnectDevice {...props} />;

  return (
    <Box flow={4} data-testid="icp-blocked-action">
      <ErrorBanner error={objection} />
      <Box horizontal justifyContent="flex-end">
        <Button primary onClick={() => props.transitionTo(backTo)}>
          <Trans i18nKey="common.back" />
        </Button>
      </Box>
    </Box>
  );
};

export default StepManageAction;
