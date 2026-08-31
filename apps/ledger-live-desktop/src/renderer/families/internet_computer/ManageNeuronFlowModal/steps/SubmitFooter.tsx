import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import type { StepProps } from "../../neuronFlow/types";

type Props = Pick<
  StepProps,
  "status" | "bridgePending" | "onClose" | "transitionTo" | "neurons" | "selectedNeuronId"
> & {
  /** Extra condition beyond the bridge's own validation, for input the bridge cannot see yet. */
  canContinue?: boolean;
  /**
   * Whether the user has entered anything yet. The bridge validates an empty field as invalid, so
   * without this every input step opens with a red banner before the user has typed a character.
   * Kept separate from `canContinue`: an entry that is present but out of range must still explain
   * itself, and that is exactly the case where the two differ.
   */
  hasInput?: boolean;
};

/**
 * Footer shared by every step that collects input before signing. Continue is gated on the bridge's
 * transaction status, so each step only has to keep the transaction up to date.
 */
const SubmitFooter = ({
  status,
  bridgePending,
  onClose,
  transitionTo,
  neurons,
  selectedNeuronId,
  canContinue = true,
  hasInput = true,
}: Props) => {
  const errors = Object.values(status.errors);
  const blocking = errors.length > 0;
  // Every step this footer serves signs against one neuron, so a neuron that has left the snapshot
  // makes Continue a dead end: the transaction still names it and the canister would refuse. The
  // step body explains the state; withholding Continue here is what stops the signature. Checked in
  // one place so a step added later cannot forget it.
  const missingNeuron = !neurons.some(neuron => neuron.id?.toString() === selectedNeuronId);

  return (
    <Box grow>
      {blocking && hasInput ? <ErrorBanner error={errors[0]} /> : null}
      <Box horizontal justifyContent="flex-end">
        <Button onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          primary
          ml={2}
          disabled={bridgePending || blocking || !canContinue || missingNeuron}
          onClick={() => transitionTo("manageAction")}
          data-testid="icp-continue-button"
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </Box>
  );
};

export default SubmitFooter;
